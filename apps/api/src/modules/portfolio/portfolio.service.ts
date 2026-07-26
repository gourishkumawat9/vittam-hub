import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Read-only — Investment rows are only ever created by PipelineService when a deal reaches CLOSED (closed-won), or edited directly for exit tracking. */
@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  listForInvestor(investorId: string) {
    return this.prisma.investment.findMany({
      where: { investorId },
      orderBy: { investedAt: "desc" },
      include: { startup: { include: { traction: true } } },
    });
  }

  async recordExit(investorId: string, startupId: string, exitValueAmount: number | undefined) {
    return this.prisma.investment.update({
      where: { investorId_startupId: { investorId, startupId } },
      data: { exitedAt: new Date(), exitValueAmount },
    });
  }

  async setFollowUp(investorId: string, startupId: string, nextFollowUpAt: Date | null) {
    return this.prisma.investment.update({
      where: { investorId_startupId: { investorId, startupId } },
      data: { nextFollowUpAt },
    });
  }

  /**
   * The Portfolio dashboard (Investor Workspace §9) — every number here is a
   * real aggregate over Investment/TrustScoreSnapshot/StartupMilestone/
   * VerificationRecord/MetricObservation, never a mark-to-market estimate.
   * "Unrealised" is capital still deployed (sum of `amount` on active
   * holdings), not a current valuation — VittamHub has no live valuation
   * feed, and CLAUDE.md §2 rules out inventing one.
   */
  async getDashboard(investorId: string) {
    const holdings = await this.prisma.investment.findMany({ where: { investorId } });
    const startupIds = holdings.map((h) => h.startupId);
    const active = holdings.filter((h) => !h.exitedAt);
    const exited = holdings.filter((h) => h.exitedAt);

    const unrealisedAmount = active.reduce((sum, h) => sum + Number(h.amount ?? 0), 0);
    const realisedAmount = exited.reduce((sum, h) => sum + Number(h.exitValueAmount ?? 0), 0);

    if (startupIds.length === 0) {
      return {
        totalInvestments: 0,
        activeInvestments: 0,
        exitedInvestments: 0,
        unrealisedAmount: 0,
        realisedAmount: 0,
        averageTrustScore: null,
        averageGrowthRatePercent: null,
        latestMilestones: [],
        recentRevenueImprovements: [],
        recentTrustImprovements: [],
        recentVerificationChanges: [],
        upcomingFollowUps: [],
      };
    }

    const [tractions, milestones, verificationRecords, upcomingFollowUps, trustSnapshotsByStartup] = await Promise.all([
      this.prisma.startupTraction.findMany({ where: { startupId: { in: startupIds } }, select: { startupId: true, growthRatePercent: true } }),
      this.prisma.startupMilestone.findMany({
        where: { startupId: { in: startupIds } },
        orderBy: { achievedAt: "desc" },
        take: 10,
        include: { startup: { select: { name: true, logoUrl: true } } },
      }),
      this.prisma.verificationRecord.findMany({
        where: { entityType: "Startup", entityId: { in: startupIds }, status: "VERIFIED" },
        orderBy: { verifiedAt: "desc" },
        take: 10,
      }),
      this.prisma.investment.findMany({
        where: { investorId, nextFollowUpAt: { gte: new Date() } },
        orderBy: { nextFollowUpAt: "asc" },
        include: { startup: { select: { name: true, logoUrl: true } } },
      }),
      this.prisma.trustScoreSnapshot.findMany({
        where: { entityType: "Startup", entityId: { in: startupIds } },
        orderBy: { computedAt: "desc" },
      }),
    ]);

    const growthRates = tractions.map((t) => t.growthRatePercent).filter((r): r is NonNullable<typeof r> => r != null).map(Number);
    const averageGrowthRatePercent = growthRates.length > 0 ? growthRates.reduce((s, r) => s + r, 0) / growthRates.length : null;

    // Latest two snapshots per startup — a real score increase, not a guess.
    const snapshotsByStartup = new Map<string, typeof trustSnapshotsByStartup>();
    for (const snap of trustSnapshotsByStartup) {
      const list = snapshotsByStartup.get(snap.entityId) ?? [];
      list.push(snap);
      snapshotsByStartup.set(snap.entityId, list);
    }
    const latestScoreByStartup: number[] = [];
    const recentTrustImprovements: { startupId: string; from: number; to: number }[] = [];
    for (const [startupId, snaps] of snapshotsByStartup) {
      const [latest, previous] = snaps;
      if (!latest) continue;
      latestScoreByStartup.push(latest.score);
      if (previous && latest.score > previous.score) {
        recentTrustImprovements.push({ startupId, from: previous.score, to: latest.score });
      }
    }
    const averageTrustScore = latestScoreByStartup.length > 0 ? latestScoreByStartup.reduce((s, v) => s + v, 0) / latestScoreByStartup.length : null;

    // Revenue improvements: last two MONTHLY_REVENUE observations per startup, where the latest is higher.
    const revenueObservations = await this.prisma.metricObservation.findMany({
      where: { startupId: { in: startupIds }, metricKey: "MONTHLY_REVENUE" },
      orderBy: { periodStart: "desc" },
    });
    const revenueByStartup = new Map<string, typeof revenueObservations>();
    for (const obs of revenueObservations) {
      const list = revenueByStartup.get(obs.startupId) ?? [];
      list.push(obs);
      revenueByStartup.set(obs.startupId, list);
    }
    const recentRevenueImprovements: { startupId: string; from: string; to: string }[] = [];
    for (const [startupId, obs] of revenueByStartup) {
      const [latest, previous] = obs;
      if (latest && previous && Number(latest.value) > Number(previous.value)) {
        recentRevenueImprovements.push({ startupId, from: previous.value.toString(), to: latest.value.toString() });
      }
    }

    return {
      totalInvestments: holdings.length,
      activeInvestments: active.length,
      exitedInvestments: exited.length,
      unrealisedAmount,
      realisedAmount,
      averageTrustScore,
      averageGrowthRatePercent,
      latestMilestones: milestones,
      recentRevenueImprovements,
      recentTrustImprovements,
      recentVerificationChanges: verificationRecords,
      upcomingFollowUps,
    };
  }
}
