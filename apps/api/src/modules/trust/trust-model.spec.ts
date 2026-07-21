import { compareTrust, type ProfileState } from "./trust-compare";
import { computeTrust, decayFactor, deriveBand, penaltyTotal, type TrustSignals } from "./trust-model";

const EMPTY: TrustSignals = {
  profileLive: false,
  emailVerified: false,
  phoneVerified: false,
  companyDepth: 0,
  founderKyc: false,
  linkedinMatched: false,
  workDomainEmail: false,
  productBundleComplete: false,
  demoPresent: false,
  liveUrlVerified: false,
  mcaVerified: false,
  dpiitVerified: false,
  gstinVerified: false,
  revenueAttested: false,
  seriesContinuity6mo: false,
  customerEvidence: false,
  roundsDocumented: false,
  investorTwoSideConfirmed: false,
  deckUploaded: false,
  risksDisclosed: false,
  capTableProvided: false,
  profileFresh30d: false,
  metricsFresh45d: false,
  noExpiredVerifications: false,
};

const FULL: TrustSignals = Object.fromEntries(
  Object.keys(EMPTY).map((k) => [k, k === "companyDepth" ? 1 : true]),
) as unknown as TrustSignals;

describe("Trust v2 — ladder", () => {
  // At S3 every component is fully applicable, so the normalized score equals the
  // raw cumulative sum — this is the exact ladder the product spec defines.
  const rungs: Array<[string, Partial<TrustSignals>, number]> = [
    ["registered only", { profileLive: true, emailVerified: true, phoneVerified: true }, 15],
    ["+ company depth", { companyDepth: 1 }, 25],
    ["+ founder verified", { founderKyc: true, linkedinMatched: true, workDomainEmail: true }, 40],
    ["+ product evidence", { productBundleComplete: true, demoPresent: true, liveUrlVerified: true }, 50],
    ["+ business/legal (V3)", { mcaVerified: true, dpiitVerified: true, gstinVerified: true }, 65],
    ["+ revenue attested (V2)", { revenueAttested: true, seriesContinuity6mo: true, customerEvidence: true }, 80],
    ["+ funding confirmed", { roundsDocumented: true, investorTwoSideConfirmed: true }, 90],
    ["+ transparency & freshness", {
      deckUploaded: true, risksDisclosed: true, capTableProvided: true,
      profileFresh30d: true, metricsFresh45d: true, noExpiredVerifications: true,
    }, 100],
  ];

  it.each(rungs.map((r, i) => [i, r[2]] as const))("reproduces ladder rung %i → score %i", (upto, expected) => {
    const signals = rungs.slice(0, upto + 1).reduce<TrustSignals>((acc, [, patch]) => ({ ...acc, ...patch }), { ...EMPTY });
    expect(computeTrust(signals, "S3").score).toBe(expected);
  });
});

describe("Trust v2 — P2: an S0 startup can legitimately reach 100", () => {
  it("renormalizes rather than zeroing inapplicable components", () => {
    // Proving everything an idea-stage startup CAN prove yields a perfect score,
    // because inapplicable components leave the denominator too.
    expect(computeTrust(FULL, "S0").score).toBe(100);
    expect(computeTrust(FULL, "S1").score).toBe(100);
    expect(computeTrust(FULL, "S4+").score).toBe(100);
  });
});

describe("Trust v2 — P4: typing cannot raise the score", () => {
  const typedButUnverified: ProfileState = {
    stage: "S3",
    // typed everything
    phoneTyped: true, websiteTyped: true, linkedinTyped: true, registrationStatusRegistered: true,
    demoUrlPresent: true, profileCompletionPct: 100, founderBioAndCityTyped: true, milestoneCount: 5, deckUploaded: true,
    // verified nothing (profile is live, but no real verification)
    profileLive: true, emailVerified: false, phoneOtpVerified: false, companyDepth: 0, founderKyc: false,
    linkedinMatched: false, workDomainEmail: false, productBundleComplete: false, liveUrlVerified: false,
    mcaVerified: false, dpiitVerified: false, gstinVerified: false, revenueAttested: false, seriesContinuity6mo: false,
    customerEvidence: false, roundsDocumented: false, investorTwoSideConfirmed: false, risksDisclosed: false,
    capTableProvided: false, profileFresh30d: false, metricsFresh45d: false, noExpiredVerifications: false,
  };

  it("quantifies the fix: v1 rewards typing (~85), v2 does not (~10)", () => {
    const { v1, v2, delta } = compareTrust(typedButUnverified);
    expect(v1).toBe(85); // current production behaviour: reachable by typing
    expect(v2).toBe(10); // v2: only profileLive(5) + demo artifact(3) + deck(2)
    expect(delta).toBe(-75);
  });

  it("is invariant to changes in any typed-only field", () => {
    const withText = { ...typedButUnverified };
    const withoutText = { ...typedButUnverified, websiteTyped: false, linkedinTyped: false, profileCompletionPct: 0, milestoneCount: 0, founderBioAndCityTyped: false };
    expect(compareTrust(withText).v2).toBe(compareTrust(withoutText).v2);
  });
});

describe("Trust v2 — decay", () => {
  it("is 1 at day 0 and ~0.497 at the TTL, monotonically decreasing", () => {
    expect(decayFactor(0, 90)).toBeCloseTo(1, 5);
    expect(decayFactor(90, 90)).toBeCloseTo(Math.exp(-0.7), 5);
    expect(decayFactor(45, 90)).toBeGreaterThan(decayFactor(90, 90));
    expect(decayFactor(200, 0)).toBe(0);
  });
});

describe("Trust v2 — bands with 4-point hysteresis", () => {
  it("assigns bands at the spec thresholds", () => {
    expect(deriveBand(90)).toBe("Platinum");
    expect(deriveBand(70)).toBe("Gold");
    expect(deriveBand(50)).toBe("Silver");
    expect(deriveBand(30)).toBe("Bronze");
    expect(deriveBand(10)).toBe("Starting");
  });

  it("does not drop a band until 4 points below its entry threshold", () => {
    expect(deriveBand(63, "Gold")).toBe("Gold"); // 63 ≥ 65−4
    expect(deriveBand(61, "Gold")).toBe("Gold"); // exactly at the floor
    expect(deriveBand(60, "Gold")).toBe("Silver"); // now it drops
    expect(deriveBand(63, undefined)).toBe("Silver"); // no hysteresis without a prior band
  });
});

describe("Trust v2 — penalties", () => {
  it("caps total penalty at 20", () => {
    expect(penaltyTotal({ failedVerifications: 10, unresolvedDisputeOver14d: true, declaredNeqVerifiedStage: true, undisclosedDownwardRevision: true, dormantOver180d: true, fraudFlag: true })).toBe(20);
  });

  it("subtracts penalties from the score", () => {
    const clean = computeTrust(FULL, "S3").score;
    const withFraud = computeTrust(FULL, "S3", { failedVerifications: 0, unresolvedDisputeOver14d: false, declaredNeqVerifiedStage: false, undisclosedDownwardRevision: false, dormantOver180d: false, fraudFlag: true }).score;
    expect(withFraud).toBe(clean - 15);
  });
});
