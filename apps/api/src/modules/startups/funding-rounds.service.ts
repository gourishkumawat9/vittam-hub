import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateFundingRoundInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Bundle 12 — each round is its own row, so total raised is computed from history, never a single typed-over number. */
@Injectable()
export class FundingRoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addForMine(founderId: string, input: CreateFundingRoundInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });
    if (!startup) throw new NotFoundException("Publish your startup profile first");

    const round = await this.prisma.fundingRound.create({
      data: { startupId: startup.id, ...input, closedAt: new Date(input.closedAt) },
    });

    this.eventEmitter.emit("profile.upserted", { ownerId: founderId });
    return round;
  }

  async removeMine(founderId: string, roundId: string) {
    const round = await this.prisma.fundingRound.findUnique({ where: { id: roundId }, include: { startup: true } });
    if (!round || round.startup.ownerId !== founderId) {
      throw new ForbiddenException("Not your funding round");
    }
    await this.prisma.fundingRound.delete({ where: { id: roundId } });
    this.eventEmitter.emit("profile.upserted", { ownerId: founderId });
  }

  listForStartup(startupId: string) {
    return this.prisma.fundingRound.findMany({ where: { startupId }, orderBy: { closedAt: "desc" } });
  }

  /** Computed, not typed — sums every round rather than trusting a single overwrite-in-place figure. */
  async totalRaised(startupId: string) {
    const result = await this.prisma.fundingRound.aggregate({ where: { startupId }, _sum: { amount: true } });
    return { totalRaised: result._sum.amount?.toString() ?? "0" };
  }
}
