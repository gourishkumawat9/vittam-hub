import type { FundingStatus, ProductStatus, RevenueStatus, StartupStage } from "@vittamhub/types";

/**
 * Bundle 3 — stage is normalized as three independent axes (product/revenue/
 * funding status), then the overall `Startup.stage` label is *computed* from
 * them rather than typed by the founder. The founder's own pick is kept
 * separately as `Startup.declaredStage` (CLAUDE.md §10 — declared vs
 * verified, show verified). A mismatch between the two feeds the
 * `declaredNeqVerifiedStage` trust penalty in trust-model.ts.
 *
 * Each axis maps onto the same ordinal scale as StartupStage; the computed
 * stage is whichever axis has progressed furthest. This is a v1 heuristic —
 * reasonable and monotonic, not a spec-mandated formula — and is deliberately
 * simple enough to explain to a founder in one sentence: "your stage is set
 * by whichever of product, revenue, or funding is furthest along."
 */
const STAGE_ORDER: StartupStage[] = ["IDEA", "VALIDATION", "PROTOTYPE", "MVP", "CUSTOMERS", "REVENUE", "FUNDED", "SCALING", "UNICORN"];

const PRODUCT_TO_STAGE: Record<ProductStatus, StartupStage> = {
  CONCEPT: "VALIDATION",
  PROTOTYPE: "PROTOTYPE",
  BETA: "MVP",
  LIVE: "MVP",
  SCALED: "SCALING",
};

const REVENUE_TO_STAGE: Record<RevenueStatus, StartupStage> = {
  NONE: "IDEA",
  PILOT: "CUSTOMERS",
  FIRST_REVENUE: "CUSTOMERS",
  RECURRING: "REVENUE",
  PROFITABLE: "REVENUE",
};

const FUNDING_TO_STAGE: Record<FundingStatus, StartupStage> = {
  BOOTSTRAPPED: "IDEA",
  ANGEL: "VALIDATION",
  PRE_SEED: "VALIDATION",
  SEED: "FUNDED",
  SERIES_A: "FUNDED",
  SERIES_B: "FUNDED",
  SERIES_C_PLUS: "SCALING",
  PE: "SCALING",
  PUBLIC: "UNICORN",
};

export function deriveOverallStage(product: ProductStatus, revenue: RevenueStatus, funding: FundingStatus): StartupStage {
  const candidates = [PRODUCT_TO_STAGE[product], REVENUE_TO_STAGE[revenue], FUNDING_TO_STAGE[funding]];
  return candidates.reduce((furthest, candidate) =>
    STAGE_ORDER.indexOf(candidate) > STAGE_ORDER.indexOf(furthest) ? candidate : furthest,
  );
}
