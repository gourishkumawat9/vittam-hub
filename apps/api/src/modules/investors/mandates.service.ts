import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, TrustBand } from "@prisma/client";
import type { CreateMandateInput, UpdateMandateInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { MatchScoreService } from "./match-score.service";

const TRUST_BAND_ORDER: TrustBand[] = ["STARTING", "BRONZE", "SILVER", "GOLD", "PLATINUM"];

/**
 * Investor Workspace — Investment Mandates. A named, reusable thesis; an
 * investor runs several at once, each producing its own match stream.
 * Matching reuses MatchScoreService's exact fit computation (never a
 * separate scoring model) by feeding it a mandate-shaped view of the
 * investor — same reasons, same weights, just swapped preferences.
 */
@Injectable()
export class MandatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchScoreService: MatchScoreService,
  ) {}

  listMine(investorOwnerId: string) {
    return this.prisma.investmentMandate.findMany({ where: { investorId: investorOwnerId }, orderBy: { createdAt: "desc" } });
  }

  create(investorOwnerId: string, input: CreateMandateInput) {
    return this.prisma.investmentMandate.create({ data: { investorId: investorOwnerId, ...input } });
  }

  async update(investorOwnerId: string, mandateId: string, input: UpdateMandateInput) {
    await this.assertOwned(investorOwnerId, mandateId);
    return this.prisma.investmentMandate.update({ where: { id: mandateId }, data: input });
  }

  async remove(investorOwnerId: string, mandateId: string) {
    await this.assertOwned(investorOwnerId, mandateId);
    return this.prisma.investmentMandate.delete({ where: { id: mandateId } });
  }

  private async assertOwned(investorOwnerId: string, mandateId: string) {
    const mandate = await this.prisma.investmentMandate.findUnique({ where: { id: mandateId } });
    if (!mandate || mandate.investorId !== investorOwnerId) throw new NotFoundException("Mandate not found");
    return mandate;
  }

  /** The match stream a mandate produces — hard filters via Prisma, then the shared MatchScoreService fit computation for ranking/reasons. */
  async matches(investorOwnerId: string, mandateId: string, limit = 20) {
    const mandate = await this.assertOwned(investorOwnerId, mandateId);
    const investor = await this.prisma.investor.findUnique({ where: { ownerId: investorOwnerId } });
    if (!investor) throw new ForbiddenException("Complete your investor profile first");

    const where: Prisma.StartupWhereInput = {
      isPublic: true,
      visibility: { notIn: ["PRIVATE", "STEALTH"] },
      ...(mandate.industries.length ? { industry: { in: mandate.industries } } : {}),
      ...(mandate.stages.length ? { stage: { in: mandate.stages } } : {}),
      ...(mandate.raisingOnly ? { isFundraising: true } : {}),
      ...(mandate.requireVerified ? { verificationStatus: "VERIFIED" } : {}),
      ...(mandate.revenueStatuses.length ? { revenueStatus: { in: mandate.revenueStatuses } } : {}),
      ...(mandate.geography.length
        ? { OR: mandate.geography.map((place) => ({ location: { contains: place, mode: "insensitive" as const } })) }
        : {}),
    };

    const candidates = await this.prisma.startup.findMany({ where, include: { funding: true }, take: 100 });

    // Feed MatchScoreService the mandate's own criteria instead of the investor's default thesis — same scoring function, different input.
    const mandateAsInvestor = {
      ...investor,
      preferredIndustries: mandate.industries.length ? mandate.industries : investor.preferredIndustries,
      preferredStages: mandate.stages.length ? mandate.stages : investor.preferredStages,
      preferredGeography: mandate.geography.length ? mandate.geography : investor.preferredGeography,
      checkSizeMinAmount: mandate.chequeMinAmount ?? investor.checkSizeMinAmount,
      checkSizeMaxAmount: mandate.chequeMaxAmount ?? investor.checkSizeMaxAmount,
    };

    const scored = await Promise.all(
      candidates.map(async (startup) => ({ startup, ...(await this.matchScoreService.scoreForInvestor(mandateAsInvestor, startup)) })),
    );

    let ranked = scored.sort((a, b) => b.score - a.score);

    if (mandate.minTrustBand) {
      const startupIds = ranked.map((r) => r.startup.id);
      const snapshots = await this.prisma.trustScoreSnapshot.findMany({
        where: { entityType: "Startup", entityId: { in: startupIds } },
        orderBy: { computedAt: "desc" },
        select: { entityId: true, band: true },
      });
      const latestBandByStartup = new Map<string, TrustBand>();
      for (const s of snapshots) {
        if (!latestBandByStartup.has(s.entityId)) latestBandByStartup.set(s.entityId, s.band);
      }
      const minOrdinal = TRUST_BAND_ORDER.indexOf(mandate.minTrustBand);
      ranked = ranked.filter((r) => {
        const band = latestBandByStartup.get(r.startup.id);
        return band ? TRUST_BAND_ORDER.indexOf(band) >= minOrdinal : false;
      });
    }

    return ranked.slice(0, limit);
  }
}
