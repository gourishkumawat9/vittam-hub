import { Injectable } from "@nestjs/common";
import type { StartupStage } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * "Build graph architecture. Graph only. No AI." (Investor Workspace §8).
 * Every edge here is a real, already-recorded fact — a shared `Investment`
 * row or a two-sided-confirmed `RelationshipClaim` (Phase 2) — never a
 * learned/inferred connection. "Potential syndicate partners" is a plain
 * overlap check on declared thesis (industries/stages), same spirit as
 * MatchScoreService: deterministic, explainable, no ranking model.
 */
@Injectable()
export class CoInvestorGraphService {
  constructor(private readonly prisma: PrismaService) {}

  async getGraph(investorOwnerId: string) {
    const [myInvestments, myInvestorProfile] = await Promise.all([
      this.prisma.investment.findMany({
        where: { investorId: investorOwnerId },
        select: { startupId: true },
      }),
      this.prisma.investor.findUnique({ where: { ownerId: investorOwnerId } }),
    ]);
    const myStartupIds = myInvestments.map((i) => i.startupId);

    if (myStartupIds.length === 0) {
      return { coInvestors: [], mutualConfirmations: 0, syndicatePartners: await this.findSyndicatePartners(investorOwnerId, myInvestorProfile, new Set()) };
    }

    const overlapping = await this.prisma.investment.findMany({
      where: { startupId: { in: myStartupIds }, investorId: { not: investorOwnerId } },
      include: {
        investor: { select: { id: true, fullName: true, avatarUrl: true } },
        startup: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const byInvestor = new Map<
      string,
      { investorId: string; fullName: string; avatarUrl: string | null; sharedStartups: { id: string; name: string; logoUrl: string | null }[] }
    >();
    for (const inv of overlapping) {
      const entry = byInvestor.get(inv.investorId) ?? {
        investorId: inv.investorId,
        fullName: inv.investor.fullName,
        avatarUrl: inv.investor.avatarUrl,
        sharedStartups: [],
      };
      entry.sharedStartups.push({ id: inv.startup.id, name: inv.startup.name, logoUrl: inv.startup.logoUrl });
      byInvestor.set(inv.investorId, entry);
    }
    // "Most frequent co-investors" — sorted by shared-startup count, the graph's edge weight.
    const coInvestors = [...byInvestor.values()].sort((a, b) => b.sharedStartups.length - a.sharedStartups.length);

    const mutualConfirmations = myInvestorProfile
      ? await this.prisma.relationshipClaim.count({
          where: {
            status: "CONFIRMED",
            relationshipType: { in: ["PORTFOLIO_INVESTMENT", "LEAD_INVESTOR"] },
            claimantType: "Investor",
            claimantId: myInvestorProfile.id,
            targetType: "Startup",
            targetId: { in: myStartupIds },
          },
        })
      : 0;

    const coInvestorIds = new Set(coInvestors.map((c) => c.investorId));
    const syndicatePartners = await this.findSyndicatePartners(investorOwnerId, myInvestorProfile, coInvestorIds);

    return { coInvestors, mutualConfirmations, syndicatePartners };
  }

  /** Investors with an overlapping declared thesis who this investor hasn't co-invested with yet — a real, explainable "who to talk to next," not a recommendation model. */
  private async findSyndicatePartners(
    investorOwnerId: string,
    myInvestorProfile: { preferredIndustries: string[]; preferredStages: StartupStage[] } | null,
    excludeOwnerIds: Set<string>,
  ) {
    if (!myInvestorProfile || (myInvestorProfile.preferredIndustries.length === 0 && myInvestorProfile.preferredStages.length === 0)) return [];

    const candidates = await this.prisma.investor.findMany({
      where: {
        ownerId: { not: investorOwnerId },
        isPublic: true,
        OR: [
          myInvestorProfile.preferredIndustries.length ? { preferredIndustries: { hasSome: myInvestorProfile.preferredIndustries } } : undefined,
          myInvestorProfile.preferredStages.length ? { preferredStages: { hasSome: myInvestorProfile.preferredStages } } : undefined,
        ].filter((c): c is NonNullable<typeof c> => !!c),
      },
      select: { ownerId: true, firmName: true, investorType: true, preferredIndustries: true, preferredStages: true, owner: { select: { fullName: true } } },
      take: 20,
    });

    return candidates.filter((c) => !excludeOwnerIds.has(c.ownerId));
  }
}
