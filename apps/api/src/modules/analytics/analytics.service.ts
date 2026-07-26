import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { InvestorMetricsService } from "../investors/investor-metrics.service";
import { PortfolioService } from "../portfolio/portfolio.service";

export interface Bucket {
  label: string;
  count: number;
}

/**
 * Every chart here is a straight aggregate over the investor's own real
 * pipeline/portfolio/connections — never a fabricated or placeholder number.
 * An investor with no activity yet gets empty arrays, not sample data.
 * Response-rate/time and portfolio health are read from InvestorMetricsService
 * and PortfolioService (not recomputed here) so this page never disagrees
 * with the dedicated screens for those numbers.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly investorMetrics: InvestorMetricsService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async getForInvestor(investorId: string) {
    const [portfolio, pipeline, connections, follows, metrics, portfolioDashboard] = await Promise.all([
      this.prisma.investment.findMany({ where: { investorId }, include: { startup: true } }),
      this.prisma.pipelineEntry.findMany({ where: { investorId }, include: { startup: true } }),
      this.prisma.connection.findMany({ where: { recipientId: investorId } }),
      this.prisma.startupFollow.findMany({ where: { investorId }, select: { startupId: true } }),
      this.investorMetrics.getFor(investorId),
      this.portfolioService.getDashboard(investorId),
    ]);

    const byIndustry = this.countBy(portfolio, (p) => p.startup.industry);
    const byGeography = this.countBy(portfolio, (p) => p.startup.headquarters ?? p.startup.location);
    const byStage = this.countBy(portfolio, (p) => p.startup.stage);
    const pipelineByStage = this.countBy(pipeline, (p) => p.stage);
    const pipelineByIndustry = this.countBy(pipeline, (p) => p.startup.industry);

    const meetings = await this.prisma.meeting.count({
      where: { connection: { OR: [{ requesterId: investorId }, { recipientId: investorId }] } },
    });
    const acceptedConnections = await this.prisma.connection.count({
      where: { recipientId: investorId, status: "ACCEPTED" },
    });

    // Deal size / closed deals — Investor Workspace §11.
    const closedEntries = pipeline.filter((p) => p.stage === "CLOSED");
    const dealAmounts = portfolio.map((p) => Number(p.amount ?? 0)).filter((a) => a > 0);
    const averageDealSize = dealAmounts.length > 0 ? dealAmounts.reduce((s, a) => s + a, 0) / dealAmounts.length : null;
    const pipelineConversion = pipeline.length > 0 ? closedEntries.length / pipeline.length : null;

    // Pass reasons — "NEVER simply record Passed" (spec §7): reasons are captured, so they can be analyzed.
    const passed = pipeline.filter((p) => p.stage === "PASSED");
    const passReasonsByReason = this.countBy(passed, (p) => p.passReason ?? "OTHER");
    const passReasonsByIndustry = this.countBy(passed, (p) => p.startup.industry);
    const evaluationDurations = passed
      .filter((p) => p.passedAt)
      .map((p) => (p.passedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const averageEvaluationDays = evaluationDurations.length > 0 ? evaluationDurations.reduce((s, d) => s + d, 0) / evaluationDurations.length : null;

    // Watchlist conversion — "did watching lead to investing?"
    const followedStartupIds = new Set(follows.map((f) => f.startupId));
    const investedFromWatchlist = portfolio.filter((p) => followedStartupIds.has(p.startupId)).length;
    const watchlistConversionRate = followedStartupIds.size > 0 ? investedFromWatchlist / followedStartupIds.size : null;

    return {
      industries: byIndustry,
      investmentDistribution: byIndustry,
      geography: byGeography,
      stage: byStage,
      pipeline: pipelineByStage,
      pipelineByIndustry,
      meetingConversion: { meetings, acceptedConnections },
      totalInvestments: portfolio.length,
      totalPipelineEntries: pipeline.length,
      connectionsReceived: connections.length,
      averageDealSize,
      dealsClosed: closedEntries.length,
      pipelineConversion,
      passReasons: { byReason: passReasonsByReason, byIndustry: passReasonsByIndustry, averageEvaluationDays, total: passed.length },
      watchlistConversion: { watchlistSize: followedStartupIds.size, investedFromWatchlist, rate: watchlistConversionRate },
      responseRate: metrics.responseRate,
      avgResponseTimeHours: metrics.avgResponseTimeHours,
      portfolioHealth: {
        averageTrustScore: portfolioDashboard.averageTrustScore,
        averageGrowthRatePercent: portfolioDashboard.averageGrowthRatePercent,
        activeInvestments: portfolioDashboard.activeInvestments,
        exitedInvestments: portfolioDashboard.exitedInvestments,
      },
    };
  }

  private countBy<T>(items: T[], key: (item: T) => string): Bucket[] {
    const counts = new Map<string, number>();
    for (const item of items) {
      const label = key(item);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  }
}
