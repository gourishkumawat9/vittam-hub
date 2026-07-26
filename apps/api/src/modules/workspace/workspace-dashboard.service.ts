import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { InvestorMetricsService } from "../investors/investor-metrics.service";
import { InvestorTrustService } from "../investors/investor-trust.service";
import { InvestorsService } from "../investors/investors.service";
import { MandatesService } from "../investors/mandates.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PipelineService } from "../pipeline/pipeline.service";
import { WatchlistTriggersService } from "../watchlist/watchlist-triggers.service";
import { WatchlistService } from "../watchlist/watchlist.service";

const BEST_MATCHES_LIMIT = 8;
const MATCHES_PER_MANDATE = 5;
const RECENT_ALERTS_LIMIT = 10;

/**
 * "The operating system an investor opens every morning" — Dashboard Home
 * is pure composition, no new business logic. Every number/list here is
 * fetched from the same service every dedicated page already uses (Trust
 * Score, Match Score, Pipeline, Watchlist, Notifications, Portfolio), so the
 * home screen can never show a different answer than the page it links to.
 */
@Injectable()
export class WorkspaceDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly investorsService: InvestorsService,
    private readonly investorMetrics: InvestorMetricsService,
    private readonly investorTrust: InvestorTrustService,
    private readonly mandatesService: MandatesService,
    private readonly pipelineService: PipelineService,
    private readonly watchlistService: WatchlistService,
    private readonly watchlistTriggersService: WatchlistTriggersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getHome(investorId: string) {
    const [investor, metrics, mandates, pipeline, watchlist, triggers, unread, recentAlerts, savedSearchCount] = await Promise.all([
      this.investorsService.getMine(investorId),
      this.investorMetrics.getFor(investorId),
      this.mandatesService.listMine(investorId),
      this.pipelineService.listForInvestor(investorId),
      this.watchlistService.listForInvestor(investorId),
      this.watchlistTriggersService.listForInvestor(investorId),
      this.notificationsService.unreadCount(investorId),
      this.notificationsService.listForUser(investorId, { page: 1, pageSize: RECENT_ALERTS_LIMIT }),
      this.prisma.savedSearch.count({ where: { investorId } }),
    ]);

    const trust = await this.investorTrust.computeAndPersist(investorId);

    const activeMandates = mandates.filter((m) => m.isActive);
    const bestMatchesToday = await this.getBestMatches(investorId, activeMandates.map((m) => m.id));

    const pipelineByStage: Record<string, number> = {};
    for (const entry of pipeline) {
      pipelineByStage[entry.stage] = (pipelineByStage[entry.stage] ?? 0) + 1;
    }

    return {
      header: {
        investorName: investor.firmName ?? "Your firm",
        trustScore: trust?.score ?? null,
        trustBand: trust?.band ?? null,
        responseRate: metrics.responseRate,
        avgResponseTimeHours: metrics.avgResponseTimeHours,
        currentlyDeployingCapital: investor.openForPitches,
        openMandatesCount: activeMandates.length,
        unreadNotifications: unread.count,
      },
      pipelineSummary: { total: pipeline.length, byStage: pipelineByStage },
      bestMatchesToday,
      watchlist: { count: watchlist.length, activeTriggers: triggers.filter((t) => t.isActive && !t.firedAt).length },
      savedSearchCount,
      activeMandates,
      recentAlerts: recentAlerts.items,
    };
  }

  private async getBestMatches(investorId: string, mandateIds: string[]) {
    if (mandateIds.length === 0) return [];

    const perMandate = await Promise.all(
      mandateIds.map((mandateId) => this.mandatesService.matches(investorId, mandateId, MATCHES_PER_MANDATE)),
    );

    const byStartup = new Map<string, (typeof perMandate)[number][number]>();
    for (const matches of perMandate) {
      for (const match of matches) {
        const existing = byStartup.get(match.startup.id);
        if (!existing || match.score > existing.score) byStartup.set(match.startup.id, match);
      }
    }

    return [...byStartup.values()].sort((a, b) => b.score - a.score).slice(0, BEST_MATCHES_LIMIT);
  }
}
