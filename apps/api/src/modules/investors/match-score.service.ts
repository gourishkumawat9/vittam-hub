import { Injectable } from "@nestjs/common";
import type { Investor, Startup, StartupFunding } from "@prisma/client";
import type { MatchScoreReason } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

type StartupWithFunding = Startup & { funding: StartupFunding | null };

/**
 * A deterministic "fit" score between one investor and one startup — every
 * reason is a real, computable overlap, never a learned/black-box ranking.
 * See docs/14-investor-portal.md for why this stays rule-based until "AI
 * Investor Matching" (a genuinely smarter ranking) is built as its own module.
 */
@Injectable()
export class MatchScoreService {
  constructor(private readonly prisma: PrismaService) {}

  /** The actual fit computation — symmetric between the two parties, so both `scoreForInvestor` and `scoreForStartup` key off this same 5-signal check. */
  private computeFit(investor: Investor, startup: StartupWithFunding) {
    const reasons: MatchScoreReason[] = [
      {
        key: "industry",
        label: "Industry match",
        weight: 30,
        matched: investor.preferredIndustries.some((industry) => industry.toLowerCase() === startup.industry.toLowerCase()),
      },
      {
        key: "stage",
        label: "Stage match",
        weight: 25,
        matched: investor.preferredStages.includes(startup.stage),
      },
      {
        key: "funding",
        label: "Funding match",
        weight: 20,
        matched: this.fundingMatches(investor, startup.funding),
      },
      {
        key: "geography",
        label: "Country match",
        weight: 15,
        matched: investor.preferredGeography.some(
          (place) =>
            (startup.headquarters?.toLowerCase().includes(place.toLowerCase()) ?? false) ||
            startup.location.toLowerCase().includes(place.toLowerCase()),
        ),
      },
      {
        key: "openForPitches",
        label: "Currently open for pitches",
        weight: 10,
        matched: investor.openForPitches,
      },
    ];

    const score = reasons.reduce((total, reason) => total + (reason.matched ? reason.weight : 0), 0);
    return { score, reasons };
  }

  private fundingMatches(investor: Investor, funding: StartupFunding | null): boolean {
    if (!funding?.fundingGoalUsd) return false;
    const goal = Number(funding.fundingGoalUsd);
    return goal >= Number(investor.checkSizeMinUsd) && goal <= Number(investor.checkSizeMaxUsd);
  }

  async scoreForInvestor(investor: Investor, startup: StartupWithFunding) {
    return { startupId: startup.id, ...this.computeFit(investor, startup) };
  }

  async scoreManyForInvestor(investorId: string, startups: StartupWithFunding[]) {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId: investorId } });
    if (!investor) return new Map<string, Awaited<ReturnType<typeof this.scoreForInvestor>>>();

    const entries = await Promise.all(startups.map((startup) => this.scoreForInvestor(investor, startup)));
    return new Map(entries.map((entry) => [entry.startupId, entry]));
  }

  /** Mirror of scoreForInvestor, keyed by investor instead of startup — "which investors fit my startup," viewed from the founder's side. Same fit computation, no ML (see class doc comment). */
  scoreForStartup(startup: StartupWithFunding, investor: Investor) {
    return { investorId: investor.id, ...this.computeFit(investor, startup) };
  }

  scoreManyForStartup(startup: StartupWithFunding, investors: Investor[]) {
    const entries = investors.map((investor) => this.scoreForStartup(startup, investor));
    return new Map(entries.map((entry) => [entry.investorId, entry]));
  }
}
