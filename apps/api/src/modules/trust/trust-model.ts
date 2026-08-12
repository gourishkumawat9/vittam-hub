/**
 * Trust Score v2 — pure, DB-free scoring model (model_version "v2.0-hypothesis").
 *
 * Answers exactly one question: "How much of what this profile claims has been
 * independently confirmed, and how recently?" (spec §13.1). It is NOT a quality
 * or investability score.
 *
 * P4 is enforced structurally: every input below is a verification, evidence,
 * integration, or recency signal. There is no free-text input, so no amount of
 * typing can move the score. See trust-model.spec.ts for the proof.
 *
 * These weights are reverse-engineered to reproduce the product-defined ladder
 * (15 → 25 → 40 → 50 → 65 → 80 → 90 → 95+). They are a starting hypothesis, not
 * parameters fitted to outcomes — recalibrate against real intro→term-sheet data
 * within two quarters (spec §13.6). Never edit them without a shadow-mode diff.
 */

export const TRUST_MODEL_VERSION = "v2.0-hypothesis";

export type TrustStage = "S0" | "S1" | "S2" | "S3" | "S4+";

/**
 * Every field is a proven/evidenced/recency signal — never typed prose, and
 * never mere completeness (D3: "V0 is exactly zero").
 *
 * Three signals were removed in the D3 cleanup because each was reachable by
 * typing alone, worth 19 of 100 points between them:
 *   · `profileLive` (5)          — publishing your own profile proves nothing.
 *   · `companyDepth` (10)        — four dropdown/typed fields (registration
 *                                  status, company type, HQ, founded year).
 *                                  None was verified against any authority.
 *                                  D3 names this component as deleted.
 *   · `productBundleComplete` (4) — literally `productName && description`,
 *                                  i.e. completeness, which D3 requires be
 *                                  displayed separately and kept out of the
 *                                  index entirely.
 * Their weight moved to components backed by genuine third-party evidence.
 */
export interface TrustSignals {
  // 1 — Registration & presence (max 10)
  emailVerified: boolean; // 5
  phoneVerified: boolean; // 5 (OTP, not a typed number)
  // 2 — Founder verification (max 20)
  founderKyc: boolean; // 11
  linkedinMatched: boolean; // 5 (identity matched, not merely pasted)
  workDomainEmail: boolean; // 4
  // 3 — Product evidence (max 10)
  demoPresent: boolean; // 5 (an actual artifact)
  liveUrlVerified: boolean; // 5 (DNS/HTTP reachable, not a typed URL)
  // 4 — Business / legal, V3 authority-verified (max 20)
  mcaVerified: boolean; // 10
  dpiitVerified: boolean; // 6
  gstinVerified: boolean; // 4
  // 5 — Revenue & traction, V2 source-attested (max 20)
  revenueAttested: boolean; // 10 (Razorpay/Stripe/GA4 integration)
  seriesContinuity6mo: boolean; // 6 (≥6 continuous months of attested observations)
  customerEvidence: boolean; // 4
  // 6 — Funding & investor confirmation (max 12)
  roundsDocumented: boolean; // 5
  investorTwoSideConfirmed: boolean; // 7 (counterparty confirmed — free V2)
  // 7 — Transparency & documents (max 5)
  deckUploaded: boolean; // 2
  risksDisclosed: boolean; // 2 (disclosed a negative rather than leaving it blank)
  capTableProvided: boolean; // 1
  // 8 — Freshness & activity (max 3)
  profileFresh30d: boolean; // 1
  metricsFresh45d: boolean; // 1
  noExpiredVerifications: boolean; // 1
}

export interface TrustPenalties {
  failedVerifications: number; // −3 each
  unresolvedDisputeOver14d: boolean; // −6
  declaredNeqVerifiedStage: boolean; // −4
  undisclosedDownwardRevision: boolean; // −3
  dormantOver180d: boolean; // −5
  fraudFlag: boolean; // −15
}

export type TrustBand = "Starting" | "Bronze" | "Silver" | "Gold" | "Platinum";

export interface TrustComponent {
  key: string;
  label: string;
  max: number;
  earned: number; // 0..max, before stage applicability
  applicability: number; // 0..1 for the given stage
}

export interface TrustResult {
  version: string;
  stage: TrustStage;
  score: number; // 0..100
  band: TrustBand;
  components: TrustComponent[];
  penaltyTotal: number; // 0..20 (already capped)
}

const MAX_PENALTY = 20;

/**
 * Component maxima, in ladder order. Sum = 100.
 *
 * "Company depth" is deliberately absent — see the TrustSignals doc comment.
 * The 19 points freed by the D3 cleanup were moved into the components that
 * rest on third-party verification (founder identity, statutory registries,
 * source-attested revenue), so the index now measures corroboration rather
 * than effort spent filling forms.
 */
const COMPONENTS = [
  { key: "registration", label: "Contact verification", max: 10 },
  { key: "founder", label: "Founder verification", max: 20 },
  { key: "product", label: "Product evidence", max: 10 },
  { key: "legal", label: "Business & legal verification", max: 20 },
  { key: "revenue", label: "Revenue & traction verification", max: 20 },
  { key: "funding", label: "Funding & investor confirmation", max: 12 },
  { key: "transparency", label: "Transparency & documents", max: 5 },
  { key: "freshness", label: "Freshness & activity", max: 3 },
] as const;

/**
 * Stage applicability (spec §13.3). Renormalizes rather than zeroes — an S0
 * startup cannot attest revenue, so that component leaves the *denominator*
 * too, letting an idea-stage startup legitimately reach 100 by proving
 * everything an idea-stage startup can prove (required by P2).
 */
const APPLICABILITY: Record<TrustStage, number[]> = {
  // registration, founder, product, legal, revenue, funding, transparency, freshness
  S0: [1, 1, 0.2, 0.3, 0.2, 0.2, 1, 1],
  S1: [1, 1, 1.0, 0.6, 0.5, 0.4, 1, 1],
  S2: [1, 1, 1.0, 1.0, 1.0, 0.8, 1, 1],
  S3: [1, 1, 1.0, 1.0, 1.0, 1.0, 1, 1],
  "S4+": [1, 1, 1.0, 1.0, 1.0, 1.0, 1, 1],
};

function earnedPerComponent(s: TrustSignals): number[] {
  return [
    (s.emailVerified ? 5 : 0) + (s.phoneVerified ? 5 : 0),
    (s.founderKyc ? 11 : 0) + (s.linkedinMatched ? 5 : 0) + (s.workDomainEmail ? 4 : 0),
    (s.demoPresent ? 5 : 0) + (s.liveUrlVerified ? 5 : 0),
    (s.mcaVerified ? 10 : 0) + (s.dpiitVerified ? 6 : 0) + (s.gstinVerified ? 4 : 0),
    (s.revenueAttested ? 10 : 0) + (s.seriesContinuity6mo ? 6 : 0) + (s.customerEvidence ? 4 : 0),
    (s.roundsDocumented ? 5 : 0) + (s.investorTwoSideConfirmed ? 7 : 0),
    (s.deckUploaded ? 2 : 0) + (s.risksDisclosed ? 2 : 0) + (s.capTableProvided ? 1 : 0),
    (s.profileFresh30d ? 1 : 0) + (s.metricsFresh45d ? 1 : 0) + (s.noExpiredVerifications ? 1 : 0),
  ];
}

export function penaltyTotal(p: TrustPenalties): number {
  const raw =
    3 * Math.max(0, p.failedVerifications) +
    (p.unresolvedDisputeOver14d ? 6 : 0) +
    (p.declaredNeqVerifiedStage ? 4 : 0) +
    (p.undisclosedDownwardRevision ? 3 : 0) +
    (p.dormantOver180d ? 5 : 0) +
    (p.fraudFlag ? 15 : 0);
  return Math.min(raw, MAX_PENALTY);
}

const ZERO_PENALTIES: TrustPenalties = {
  failedVerifications: 0,
  unresolvedDisputeOver14d: false,
  declaredNeqVerifiedStage: false,
  undisclosedDownwardRevision: false,
  dormantOver180d: false,
  fraudFlag: false,
};

/**
 * Bands with 4-point hysteresis (spec §13.4). Pass the previous band to prevent
 * distressing oscillation across a threshold.
 */
export function deriveBand(score: number, previous?: TrustBand): TrustBand {
  const enter = (s: number): TrustBand => {
    if (s >= 85) return "Platinum";
    if (s >= 65) return "Gold";
    if (s >= 45) return "Silver";
    if (s >= 25) return "Bronze";
    return "Starting";
  };
  const raw = enter(score);
  if (!previous) return raw;
  const floor: Record<TrustBand, number> = { Starting: 0, Bronze: 25, Silver: 45, Gold: 65, Platinum: 85 };
  // Only drop out of the previous band once 4 points below its entry threshold.
  if (score >= floor[previous] - 4) return previous;
  return raw;
}

/**
 * Per-verification decay (spec §13.3): a verification's contribution fades as it
 * ages toward its TTL. Applied by the service layer (which knows timestamps) to
 * each verification-derived `earned` value before it enters computeTrust — kept
 * here as a pure, tested function. decay(0)=1; decay(ttl)≈0.497.
 */
export function decayFactor(daysSinceVerified: number, ttlDays: number): number {
  if (ttlDays <= 0) return 0;
  const d = Math.max(0, daysSinceVerified);
  return Math.exp((-0.7 * d) / ttlDays);
}

export function computeTrust(
  signals: TrustSignals,
  stage: TrustStage,
  penalties: TrustPenalties = ZERO_PENALTIES,
  previousBand?: TrustBand,
): TrustResult {
  const earned = earnedPerComponent(signals);
  const app = APPLICABILITY[stage];
  const pen = penaltyTotal(penalties);

  const components: TrustComponent[] = COMPONENTS.map((c, i) => ({
    key: c.key,
    label: c.label,
    max: c.max,
    earned: earned[i] ?? 0,
    applicability: app[i] ?? 0,
  }));

  const numerator = components.reduce((sum, c) => sum + c.earned * c.applicability, 0) - pen;
  const denominator = components.reduce((sum, c) => sum + c.max * c.applicability, 0);
  const normalized = denominator === 0 ? 0 : (numerator * 100) / denominator;
  const score = Math.max(0, Math.min(100, Math.round(normalized)));

  return { version: TRUST_MODEL_VERSION, stage, score, band: deriveBand(score, previousBand), components, penaltyTotal: pen };
}
