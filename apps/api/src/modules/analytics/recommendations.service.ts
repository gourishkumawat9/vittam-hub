import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { InvestorMetricsService } from "../investors/investor-metrics.service";
import { MatchScoreService } from "../investors/match-score.service";
import { FounderActivityService } from "../startups/founder-activity.service";

/**
 * Deterministic, rule-based suggestions — every list here is a real database
 * aggregate (highest trust score, highest growth rate, most recent activity).
 * This is NOT a machine-learning recommender; "AI Recommendations" in the
 * fuller sense is intentionally future-scoped (see CLAUDE.md future-modules)
 * once there's enough usage data to actually learn from.
 */
@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchScoreService: MatchScoreService,
    private readonly founderActivityService: FounderActivityService,
    private readonly investorMetricsService: InvestorMetricsService,
  ) {}

  async getForInvestor(investorId: string) {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId: investorId } });

    const baseWhere = { isPublic: true, verificationStatus: "VERIFIED" as const };

    const [highPotential, fastestGrowing, recentlyFundraising, portfolio, recentlyVerified, recentlyActiveIds] = await Promise.all([
      this.prisma.startup.findMany({
        where: {
          ...baseWhere,
          ...(investor?.preferredIndustries.length ? { industry: { in: investor.preferredIndustries } } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      this.prisma.startup.findMany({
        where: { ...baseWhere, traction: { growthRatePercent: { gt: 0 } } },
        include: { traction: true },
        orderBy: { traction: { growthRatePercent: "desc" } },
        take: 6,
      }),
      this.prisma.startup.findMany({
        where: { ...baseWhere, isFundraising: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      this.prisma.investment.findMany({ where: { investorId }, include: { startup: true } }),
      this.prisma.startup.findMany({
        where: { ...baseWhere, verifiedAt: { not: null } },
        orderBy: { verifiedAt: "desc" },
        take: 6,
      }),
      this.founderActivityService.recentlyActiveStartupIds(14, 6),
    ]);

    const portfolioIndustries = new Set(portfolio.map((p) => p.startup.industry));
    const similarToPortfolio = portfolioIndustries.size
      ? await this.prisma.startup.findMany({
          where: {
            ...baseWhere,
            industry: { in: Array.from(portfolioIndustries) },
            id: { notIn: portfolio.map((p) => p.startupId) },
          },
          take: 6,
        })
      : [];

    // recentlyActiveIds is already ranked most-recent-first (see
    // FounderActivityService.recentlyActiveStartupIds) — a second query would
    // lose that order, so fetch each row and re-sort to match the id order.
    const recentlyActiveRows = recentlyActiveIds.length
      ? await this.prisma.startup.findMany({ where: { id: { in: recentlyActiveIds }, ...baseWhere } })
      : [];
    const recentlyActiveById = new Map(recentlyActiveRows.map((s) => [s.id, s]));
    const recentlyActiveFounders = recentlyActiveIds.map((id) => recentlyActiveById.get(id)).filter((s): s is NonNullable<typeof s> => !!s);

    const trendingIndustries = this.topIndustries(recentlyFundraising);

    return {
      highPotentialStartups: highPotential,
      trendingIndustries,
      emergingMarkets: this.topLocations(recentlyFundraising),
      fastestGrowingCompanies: fastestGrowing,
      similarToPreviousInvestments: similarToPortfolio,
      recentlyVerifiedStartups: recentlyVerified,
      recentlyActiveFounders,
    };
  }

  /**
   * The founder-side mirror of getForInvestor — "which investors fit my
   * startup," ranked by MatchScoreService.scoreForStartup (same rule-based
   * signals, viewed from the founder's side, no ML). Returns an empty list
   * rather than throwing when the caller hasn't published a startup yet.
   */
  async getForFounder(founderId: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { ownerId: founderId },
      include: { funding: true },
    });
    if (!startup) return { recommendedInvestors: [] };

    const candidates = await this.prisma.investor.findMany({
      where: {
        isPublic: true,
        verificationStatus: "VERIFIED",
        openForPitches: true,
        OR: [{ preferredIndustries: { has: startup.industry } }, { preferredStages: { has: startup.stage } }],
      },
      take: 25,
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });

    const scored = Array.from(this.matchScoreService.scoreManyForStartup(startup, candidates).values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const investorsById = new Map(candidates.map((investor) => [investor.id, investor]));
    const metricsByOwner = await this.investorMetricsService.getManyFor(scored.map((match) => investorsById.get(match.investorId)!.ownerId));
    const recommendedInvestors = scored.map((match) => {
      const investor = investorsById.get(match.investorId)!;
      return { ...match, investor: { ...investor, metrics: metricsByOwner.get(investor.ownerId) ?? null } };
    });

    return { recommendedInvestors };
  }

  private topIndustries(startups: { industry: string }[]) {
    const counts = new Map<string, number>();
    for (const s of startups) counts.set(s.industry, (counts.get(s.industry) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([industry, count]) => ({ industry, count }));
  }

  private topLocations(startups: { headquarters: string | null; location: string }[]) {
    const counts = new Map<string, number>();
    for (const s of startups) {
      const place = s.headquarters ?? s.location;
      counts.set(place, (counts.get(place) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => ({ location, count }));
  }
}
