import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateWatchlistTriggerInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * CRUD for watchlist triggers — see WatchlistTriggerEvaluatorService for the
 * condition logic and the BullMQ job that fires them. `baselineValue`
 * (team size / patent count at creation time) is captured here since only
 * the create path knows "now" is the starting point for a "doubled"/
 * "increased" comparison.
 */
@Injectable()
export class WatchlistTriggersService {
  constructor(private readonly prisma: PrismaService) {}

  listForInvestor(investorId: string) {
    return this.prisma.watchlistTrigger.findMany({
      where: { investorId },
      orderBy: { createdAt: "desc" },
      include: { startup: { select: { id: true, name: true, logoUrl: true, slug: true } } },
    });
  }

  async create(investorId: string, input: CreateWatchlistTriggerInput) {
    const startup = await this.prisma.startup.findUnique({
      where: { id: input.startupId },
      include: { teamMembers: true, traction: true },
    });
    if (!startup) throw new NotFoundException("Startup not found");

    let baselineValue: number | undefined;
    if (input.type === "HEADCOUNT_DOUBLED") baselineValue = startup.teamSize;
    if (input.type === "PATENT_GRANTED") baselineValue = startup.traction?.patents.length ?? 0;

    return this.prisma.watchlistTrigger.create({
      data: {
        investorId,
        startupId: input.startupId,
        type: input.type,
        thresholdAmount: input.thresholdAmount,
        thresholdBand: input.thresholdBand,
        baselineValue,
      },
    });
  }

  async remove(investorId: string, triggerId: string) {
    const trigger = await this.prisma.watchlistTrigger.findUnique({ where: { id: triggerId } });
    if (!trigger || trigger.investorId !== investorId) throw new NotFoundException("Trigger not found");
    return this.prisma.watchlistTrigger.delete({ where: { id: triggerId } });
  }
}
