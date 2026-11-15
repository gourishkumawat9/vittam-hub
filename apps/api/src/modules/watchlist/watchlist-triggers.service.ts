import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateWatchlistTriggerInput } from "@vittamhub/types";

import { isDemoViewer } from "../../common/demo/demo-scope";
import { findListableStartup, listableStartupWhere } from "../../common/startups/startup-visibility";
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

  async listForInvestor(investorId: string) {
    return this.prisma.watchlistTrigger.findMany({
      where: { investorId, startup: listableStartupWhere(await isDemoViewer(this.prisma, investorId)) },
      orderBy: { createdAt: "desc" },
      include: { startup: { select: { id: true, name: true, logoUrl: true, slug: true } } },
    });
  }

  async create(investorId: string, input: CreateWatchlistTriggerInput) {
    await findListableStartup(this.prisma, input.startupId, investorId);
    const startup = await this.prisma.startup.findUnique({
      where: { id: input.startupId },
      include: { teamMembers: true, traction: true },
    });
    if (!startup) throw new NotFoundException("Startup not found");
    // "Tell me when revenue passes X" answers a question about revenue. A
    // founder who hides their numbers hasn't agreed to answer it, and a few
    // alerts at different amounts would read the figure out.
    if (input.type === "REVENUE_ABOVE" && startup.metricsVisibility === "HIDDEN") {
      throw new ForbiddenException("This startup keeps its revenue private, so a revenue alert can't be set on it");
    }

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
