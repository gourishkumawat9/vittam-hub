/**
 * v1 → v2 Trust Score comparison harness (pure, DB-free).
 *
 * Given one profile's state, emit both the *current* v1 score (which rewards
 * typing — see startups/trust-score.service.ts) and the v2 score (verification
 * only), plus the delta. This is what turns the Phase-4 cutover into a
 * measurement instead of a leap of faith: run it across the corpus, publish the
 * distribution of deltas, then flip FF_TRUST_V2.
 */

import { computeTrust, type TrustSignals, type TrustStage } from "./trust-model";

/**
 * A profile as the *current* system sees it — deliberately a superset that
 * separates what was TYPED from what was VERIFIED, so the harness can show how
 * differently the two models treat the same profile.
 */
export interface ProfileState {
  stage: TrustStage;

  // Typed / self-declared (v1 rewards these; v2 ignores them)
  phoneTyped: boolean;
  websiteTyped: boolean;
  linkedinTyped: boolean;
  registrationStatusRegistered: boolean; // founder-set enum, no MCA check
  demoUrlPresent: boolean;
  profileCompletionPct: number; // 0..100
  founderBioAndCityTyped: boolean;
  milestoneCount: number;
  deckUploaded: boolean;

  // Verified / evidenced (v2 rewards these)
  profileLive: boolean;
  emailVerified: boolean;
  phoneOtpVerified: boolean;
  companyDepth: number; // 0..1 of structured, verifiable company facts
  founderKyc: boolean;
  linkedinMatched: boolean;
  workDomainEmail: boolean;
  productBundleComplete: boolean;
  liveUrlVerified: boolean;
  mcaVerified: boolean;
  dpiitVerified: boolean;
  gstinVerified: boolean;
  revenueAttested: boolean;
  seriesContinuity6mo: boolean;
  customerEvidence: boolean;
  roundsDocumented: boolean;
  investorTwoSideConfirmed: boolean;
  risksDisclosed: boolean;
  capTableProvided: boolean;
  profileFresh30d: boolean;
  metricsFresh45d: boolean;
  noExpiredVerifications: boolean;
}

/** Faithful pure replica of the current TrustScoreService factor logic. */
export function computeTrustV1(p: ProfileState): number {
  let s = 0;
  if (p.emailVerified) s += 15;
  if (p.phoneTyped) s += 5;
  if (p.websiteTyped) s += 10;
  if (p.linkedinTyped) s += 10;
  if (p.registrationStatusRegistered) s += 15;
  if (p.deckUploaded) s += 15;
  if (p.demoUrlPresent) s += 10;
  if (p.profileCompletionPct >= 80) s += 10;
  if (p.founderBioAndCityTyped) s += 5;
  if (p.milestoneCount > 0) s += 5;
  return s;
}

/** Project a ProfileState onto the v2 signal set — verified facts only. */
export function toTrustSignals(p: ProfileState): TrustSignals {
  return {
    profileLive: p.profileLive,
    emailVerified: p.emailVerified,
    phoneVerified: p.phoneOtpVerified, // typing a number is worth nothing here
    companyDepth: p.companyDepth,
    founderKyc: p.founderKyc,
    linkedinMatched: p.linkedinMatched, // matched identity, not a pasted URL
    workDomainEmail: p.workDomainEmail,
    productBundleComplete: p.productBundleComplete,
    demoPresent: p.demoUrlPresent, // a provided demo artifact is weak evidence, counts
    liveUrlVerified: p.liveUrlVerified, // DNS/HTTP reachable, not a typed URL
    mcaVerified: p.mcaVerified,
    dpiitVerified: p.dpiitVerified,
    gstinVerified: p.gstinVerified,
    revenueAttested: p.revenueAttested,
    seriesContinuity6mo: p.seriesContinuity6mo,
    customerEvidence: p.customerEvidence,
    roundsDocumented: p.roundsDocumented,
    investorTwoSideConfirmed: p.investorTwoSideConfirmed,
    deckUploaded: p.deckUploaded,
    risksDisclosed: p.risksDisclosed,
    capTableProvided: p.capTableProvided,
    profileFresh30d: p.profileFresh30d,
    metricsFresh45d: p.metricsFresh45d,
    noExpiredVerifications: p.noExpiredVerifications,
  };
}

export interface TrustComparison {
  v1: number;
  v2: number;
  delta: number; // v2 − v1
}

export function compareTrust(p: ProfileState): TrustComparison {
  const v1 = computeTrustV1(p);
  const v2 = computeTrust(toTrustSignals(p), p.stage).score;
  return { v1, v2, delta: v2 - v1 };
}
