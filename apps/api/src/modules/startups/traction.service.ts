import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { UpdateTractionInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { recordTractionObservations } from "./metric-observations.util";

/**
 * Post-publish traction updates — the "share updates" half of Bundle 10 and
 * Bundle 26 (monthly founder updates). Every call both overwrites the
 * current-value `StartupTraction` row (what the profile displays today) and
 * appends to `MetricObservation` (the dated history a trend chart reads).
 */
@Injectable()
export class TractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updateMine(founderId: string, input: UpdateTractionInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });
    if (!startup) throw new NotFoundException("Publish your startup profile first");

    const updated = await this.prisma.$transaction(async (tx) => {
      const traction = await tx.startupTraction.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, ...input },
        update: input,
      });
      await recordTractionObservations(tx, startup.id, input, startup.currency, "self-declared:update");
      return traction;
    });

    this.eventEmitter.emit("profile.upserted", { ownerId: founderId });
    return updated;
  }

  /** Grouped by metric so the frontend can plot one line per metric without client-side reshaping. */
  async history(startupId: string, limit = 24) {
    const observations = await this.prisma.metricObservation.findMany({
      where: { startupId },
      orderBy: { periodStart: "desc" },
      take: limit * 6, // enough rows to cover `limit` periods across every metric key
    });

    const grouped = new Map<string, typeof observations>();
    for (const obs of observations) {
      const list = grouped.get(obs.metricKey) ?? [];
      list.push(obs);
      grouped.set(obs.metricKey, list);
    }

    return Object.fromEntries(
      [...grouped.entries()].map(([metricKey, points]) => [
        metricKey,
        points
          .slice(0, limit)
          .reverse()
          .map((p) => ({ value: p.value.toString(), periodStart: p.periodStart, source: p.source, verificationTier: p.verificationTier })),
      ]),
    );
  }
}
