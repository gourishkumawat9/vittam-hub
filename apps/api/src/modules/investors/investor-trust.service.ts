import { Injectable } from "@nestjs/common";
import type { Prisma, TrustBand as PrismaTrustBand } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

import { InvestorMetricsService } from "./investor-metrics.service";

export interface InvestorTrustFactor {
  key: string;
  label: string;
  weight: number;
  earned: boolean;
}

/**
 * "Protecting founders from fake investors is as important as verifying
 * startups" (CLAUDE.md §8 / spec §4/§28 — every user type gets a Trust
 * Score). Deliberately a simpler, separate model from trust-model.ts's
 * startup-shaped v2 (product/revenue/funding evidence make no sense for an
 * investor entity) — same auditable-boolean-factors style as TrustScoreService
 * v1, persisted to the same polymorphic TrustScoreSnapshot table under
 * entityType "Investor" so both entity types share one history mechanism.
 */
@Injectable()
export class InvestorTrustService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly investorMetrics: InvestorMetricsService,
  ) {}

  private deriveBand(score: number): PrismaTrustBand {
    if (score >= 85) return "PLATINUM";
    if (score >= 65) return "GOLD";
    if (score >= 45) return "SILVER";
    if (score >= 25) return "BRONZE";
    return "STARTING";
  }

  async computeAndPersist(investorOwnerId: string) {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId: investorOwnerId } });
    if (!investor) return null;

    const [owner, govIdDoc, verifiedRecords, metrics] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: investorOwnerId } }),
      this.prisma.document.findFirst({ where: { userId: investorOwnerId, type: "GOVERNMENT_ID" } }),
      this.prisma.verificationRecord.findMany({
        where: {
          status: "VERIFIED",
          OR: [
            { entityType: "User", entityId: investorOwnerId, field: "workEmail" },
            { entityType: "Investor", entityId: investor.id, method: { in: ["SEBI_API", "MCA_API"] } },
          ],
        },
      }),
      this.investorMetrics.getFor(investorOwnerId),
    ]);

    const workDomainEmail = verifiedRecords.some((r) => r.method === "DOMAIN_EMAIL_HEURISTIC");
    const sebiVerified = verifiedRecords.some((r) => r.method === "SEBI_API");
    const mcaVerified = verifiedRecords.some((r) => r.method === "MCA_API");
    const responseRateGood = metrics.responseRate !== null && metrics.responseRate >= 0.5;
    const profileComplete = !!(investor.bio.trim() && investor.preferredIndustries.length > 0 && investor.preferredStages.length > 0);

    const factors: InvestorTrustFactor[] = [
      { key: "emailVerified", label: "Email verified", weight: 10, earned: !!owner.emailVerifiedAt },
      { key: "workDomainEmail", label: "Work-domain email verified", weight: 15, earned: workDomainEmail },
      { key: "kycDocument", label: "Government ID on file", weight: 20, earned: !!govIdDoc },
      { key: "sebiVerified", label: "SEBI registration verified", weight: 25, earned: sebiVerified },
      { key: "mcaVerified", label: "Firm registration (MCA) verified", weight: 10, earned: mcaVerified },
      { key: "responseRate", label: "Responds to at least half of connect requests", weight: 15, earned: responseRateGood },
      { key: "profileComplete", label: "Thesis, stages, and industries on file", weight: 5, earned: profileComplete },
    ];

    const score = Math.min(
      100,
      factors.reduce((total, f) => total + (f.earned ? f.weight : 0), 0),
    );
    const band = this.deriveBand(score);

    await this.prisma.trustScoreSnapshot.create({
      data: { entityType: "Investor", entityId: investor.id, score, band, breakdown: { factors } as unknown as Prisma.InputJsonValue },
    });

    return { score, band, factors };
  }

  latest(investorId: string) {
    return this.prisma.trustScoreSnapshot.findFirst({
      where: { entityType: "Investor", entityId: investorId },
      orderBy: { computedAt: "desc" },
    });
  }

  /** Cheap batched read (no recompute) for list views — avoids an N-query recompute storm on every discovery page load. */
  async latestMany(investorIds: string[]): Promise<Map<string, { score: number; band: PrismaTrustBand }>> {
    if (investorIds.length === 0) return new Map();
    const rows = await this.prisma.trustScoreSnapshot.findMany({
      where: { entityType: "Investor", entityId: { in: investorIds } },
      orderBy: { computedAt: "desc" },
      select: { entityId: true, score: true, band: true },
    });
    const map = new Map<string, { score: number; band: PrismaTrustBand }>();
    for (const row of rows) {
      if (!map.has(row.entityId)) map.set(row.entityId, { score: row.score, band: row.band }); // first hit per id = most recent, since ordered desc
    }
    return map;
  }
}
