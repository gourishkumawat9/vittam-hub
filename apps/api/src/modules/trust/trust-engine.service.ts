import { Injectable, Logger } from "@nestjs/common";
import type { Prisma, TrustBand as PrismaTrustBand } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

import { computeTrust, type TrustBand, type TrustResult, type TrustSignals, type TrustStage } from "./trust-model";

export interface NextBestAction {
  key: string;
  label: string;
  gap: number; // points still available on this component, at the startup's current stage
  suggestion: string;
}

/** One human-readable suggestion per component key — static copy, not derived from typed text (stays P4-clean). */
const NEXT_BEST_ACTION_COPY: Record<string, string> = {
  registration: "Verify your email address and confirm your phone number by OTP.",
  founder: "Complete founder KYC and use a work-domain email instead of a personal one.",
  product: "Add a product demo video and a live, reachable product URL.",
  legal: "Get your MCA, DPIIT, and GSTIN registrations verified.",
  revenue: "Connect a payment gateway or bank account so your revenue can be source-attested.",
  funding: "Ask your investors to confirm the relationship on their own VittamHub account.",
  transparency: "Upload your pitch deck and cap table, and disclose any known risks.",
  freshness: "Update your profile and metrics — it's been a while since the last update.",
};

/**
 * Persists Trust Score v2 (trust-model.ts) as TrustScoreSnapshot history,
 * running in shadow alongside the live v1 scorer (TrustScoreService) — see
 * trust-compare.ts for why v2 isn't live yet ("flip FF_TRUST_V2" is a future
 * step, not this one). This service only ever reads real signals; any fact
 * this platform can't yet verify automatically is hardcoded false rather than
 * inferred from typed text, so v2 stays P4-clean from day one.
 */
@Injectable()
export class TrustEngineService {
  private readonly logger = new Logger(TrustEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  private static readonly STAGE_MAP: Record<string, TrustStage> = {
    IDEA: "S0",
    VALIDATION: "S0",
    PROTOTYPE: "S1",
    MVP: "S1",
    CUSTOMERS: "S2",
    REVENUE: "S2",
    FUNDED: "S3",
    SCALING: "S4+",
    UNICORN: "S4+",
  };

  private static readonly BAND_TO_PRISMA: Record<TrustBand, PrismaTrustBand> = {
    Starting: "STARTING",
    Bronze: "BRONZE",
    Silver: "SILVER",
    Gold: "GOLD",
    Platinum: "PLATINUM",
  };

  private static readonly BAND_FROM_PRISMA: Record<PrismaTrustBand, TrustBand> = {
    STARTING: "Starting",
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
  };

  // Cheap, automatable-today proxy for Bundle 1's "work email, not gmail" V2
  // check (spec §5) — a real domain-ownership/MX check is Phase 2.
  private static readonly FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
  ]);

  /** Best-effort: never throw into a caller's request path over a shadow-mode write. */
  async computeAndPersistForStartupSafely(startupId: string): Promise<void> {
    try {
      await this.computeAndPersistForStartup(startupId);
    } catch (err) {
      this.logger.warn(`Trust v2 snapshot failed for startup ${startupId}: ${(err as Error).message}`);
    }
  }

  async computeAndPersistForStartup(startupId: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { id: startupId },
      include: {
        owner: { include: { profile: true } },
        product: true,
        traction: true,
        funding: true,
      },
    });
    if (!startup) return null;

    const now = new Date();
    const [pitchDeck, capTable, userRecords, startupRecords, twoSidedInvestorClaim] = await Promise.all([
      this.prisma.document.findFirst({ where: { userId: startup.ownerId, type: "PITCH_DECK" } }),
      this.prisma.document.findFirst({ where: { userId: startup.ownerId, type: "CAP_TABLE" } }),
      this.prisma.verificationRecord.findMany({
        where: { entityType: "User", entityId: startup.ownerId, status: "VERIFIED", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      this.prisma.verificationRecord.findMany({
        where: {
          entityType: "Startup",
          entityId: startup.id,
          status: "VERIFIED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.prisma.relationshipClaim.findFirst({
        where: {
          status: "CONFIRMED",
          relationshipType: { in: ["PORTFOLIO_INVESTMENT", "LEAD_INVESTOR"] },
          OR: [
            { claimantType: "Startup", claimantId: startup.id },
            { targetType: "Startup", targetId: startup.id },
          ],
        },
      }),
    ]);

    // Falls back to the local heuristic (real, no DB dependency) if the async
    // ledger check (VerificationOrchestratorService's profile.upserted listener)
    // hasn't run for this owner yet — e.g. right after a fresh signup.
    const workDomainEmailRecord = userRecords.find((r) => r.field === "workEmail" && r.method === "DOMAIN_EMAIL_HEURISTIC");
    const emailDomain = startup.owner.email.split("@")[1]?.toLowerCase();
    const workDomainEmail = workDomainEmailRecord
      ? true
      : !!emailDomain && !TrustEngineService.FREE_EMAIL_DOMAINS.has(emailDomain);

    const mcaVerified = startupRecords.some((r) => r.method === "MCA_API");
    const dpiitVerified = startupRecords.some((r) => r.method === "DPIIT_API");
    const gstinVerified = startupRecords.some((r) => r.method === "GSTIN_API");

    const signals: TrustSignals = {
      emailVerified: !!startup.owner.emailVerifiedAt,
      phoneVerified: !!startup.owner.phoneVerifiedAt, // real OTP round-trip — PhoneVerificationService
      founderKyc: false, // Phase 3+: government ID (DigiLocker) verification not integrated yet
      linkedinMatched: false, // Phase 3+: LinkedIn URL is typed today, not identity-matched
      workDomainEmail,
      demoPresent: !!(startup.product?.demoVideoUrl || startup.product?.pitchVideoUrl),
      liveUrlVerified: false, // Phase 3+: no DNS/HTTP reachability check yet
      mcaVerified, // reads the ledger — flips true automatically once MCA_API_KEY is configured, no code change needed
      dpiitVerified,
      gstinVerified,
      revenueAttested: false, // Phase 3+: no payment-gateway/bank integration yet
      seriesContinuity6mo: false, // needs >=6mo of MetricObservation history — table just created, empty
      // Both of these previously read a typed field — a self-reported customer
      // count, and a self-selected list of funding types. Neither is corroborated
      // by anything, so under D3 they are worth zero until there is real evidence
      // (a confirmed customer reference; a round corroborated by MCA filing dates
      // or an investor's two-sided confirmation). Stubbed false in the same
      // honest style as the other un-integrated signals above rather than
      // silently paying out for typing.
      customerEvidence: false,
      roundsDocumented: false,
      investorTwoSideConfirmed: !!twoSidedInvestorClaim, // RelationshipClaimsService — spec §9
      deckUploaded: !!pitchDeck,
      risksDisclosed: false, // no negative-disclosure field modeled yet
      capTableProvided: !!capTable,
      profileFresh30d: this.withinDays(startup.updatedAt, 30),
      metricsFresh45d: startup.traction ? this.withinDays(startup.traction.updatedAt, 45) : false,
      noExpiredVerifications: true, // vacuously true until VerificationRecord rows with expiry exist
    };

    const stage = TrustEngineService.STAGE_MAP[startup.stage] ?? "S0";

    const previous = await this.prisma.trustScoreSnapshot.findFirst({
      where: { entityType: "Startup", entityId: startupId },
      orderBy: { computedAt: "desc" },
    });
    const previousBand = previous ? TrustEngineService.BAND_FROM_PRISMA[previous.band] : undefined;

    const penalties = {
      failedVerifications: 0,
      unresolvedDisputeOver14d: false,
      declaredNeqVerifiedStage: !!(startup.declaredStage && startup.declaredStage !== startup.stage),
      undisclosedDownwardRevision: false,
      dormantOver180d: !this.withinDays(startup.updatedAt, 180),
      fraudFlag: false,
    };

    const result = computeTrust(signals, stage, penalties, previousBand);

    await this.prisma.trustScoreSnapshot.create({
      data: {
        entityType: "Startup",
        entityId: startupId,
        score: result.score,
        band: TrustEngineService.BAND_TO_PRISMA[result.band],
        breakdown: result as unknown as Prisma.InputJsonValue,
      },
    });

    return result;
  }

  async history(entityType: string, entityId: string, limit = 50) {
    return this.prisma.trustScoreSnapshot.findMany({
      where: { entityType, entityId },
      orderBy: { computedAt: "desc" },
      take: limit,
    });
  }

  /** Biggest point gaps first — "what should this founder do next," not a flat checklist. */
  nextBestActions(result: TrustResult, limit = 4): NextBestAction[] {
    return result.components
      .map((c) => ({ key: c.key, label: c.label, gap: Math.round(c.max * c.applicability - c.earned), suggestion: NEXT_BEST_ACTION_COPY[c.key] ?? "" }))
      .filter((a) => a.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, limit);
  }

  /** Recomputes fresh (cheap, all-DB-read), then bundles with next-best-actions and recent history for the founder-only preview endpoint. */
  async getPreview(startupId: string) {
    const result = await this.computeAndPersistForStartup(startupId);
    if (!result) return null;
    const history = await this.history("Startup", startupId, 30);
    return {
      ...result,
      nextBestActions: this.nextBestActions(result),
      history: history.map((h) => ({ score: h.score, band: h.band, computedAt: h.computedAt })),
    };
  }

  private withinDays(date: Date | null | undefined, days: number): boolean {
    if (!date) return false;
    return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
  }
}
