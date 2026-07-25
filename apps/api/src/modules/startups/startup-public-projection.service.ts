import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { MetricVisibility, ProfileVisibility, StartupFunding, StartupTraction } from "@prisma/client";

export interface StartupViewerContext {
  isOwner: boolean;
  isInvestor: boolean;
}

interface ProjectableStartup {
  visibility: ProfileVisibility;
  metricsVisibility: MetricVisibility;
  traction?: StartupTraction | null;
  funding?: StartupFunding | null;
}

// Bundle 11's own example format: "₹50L–1Cr ARR · verified" — bucket
// boundaries in rupees (1L = 1,00,000; 1Cr = 1,00,00,000).
const INR_BANDS: { below: number; label: string }[] = [
  { below: 100_000, label: "< ₹1L" },
  { below: 1_000_000, label: "₹1L–10L" },
  { below: 5_000_000, label: "₹10L–50L" },
  { below: 10_000_000, label: "₹50L–1Cr" },
  { below: 50_000_000, label: "₹1Cr–5Cr" },
  { below: 250_000_000, label: "₹5Cr–25Cr" },
  { below: 1_000_000_000, label: "₹25Cr–100Cr" },
];

export function bandifyAmount(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return null;
  const band = INR_BANDS.find((b) => n < b.below);
  return band ? band.label : "₹100Cr+";
}

/**
 * Bundle 30 — "the public profile is a curated, permission-filtered
 * projection — never the raw record." Before this service existed,
 * `getBySlug`/search returned the full Prisma row (exact revenue, burn rate,
 * valuation, raise target — all PRIV/INV-only per the spec's own field
 * tags) to anyone who asked. This is the fix: every non-owner view goes
 * through `project()`, which enforces the visibility gate and bands or
 * strips financial fields per Bundle 11/30.
 */
@Injectable()
export class StartupPublicProjectionService {
  project<T extends ProjectableStartup>(startup: T, viewer: StartupViewerContext): T {
    if (viewer.isOwner) return startup;

    if (startup.visibility === "PRIVATE" || startup.visibility === "STEALTH") {
      throw new NotFoundException("Startup not found");
    }
    if (startup.visibility === "INVESTOR_ONLY" && !viewer.isInvestor) {
      throw new ForbiddenException("This profile is visible to investors only");
    }

    // Investors see exact figures (the deal-evaluation case Bundle 11 is
    // built around); everyone else gets the founder's chosen display mode.
    const traction = startup.traction ? this.projectTraction(startup.traction, startup.metricsVisibility, viewer.isInvestor) : startup.traction;
    const funding = startup.funding ? this.projectFunding(startup.funding, viewer.isInvestor) : startup.funding;

    return { ...startup, traction, funding };
  }

  private projectTraction(traction: StartupTraction, metricsVisibility: MetricVisibility, isInvestor: boolean): StartupTraction {
    if (isInvestor && metricsVisibility !== "HIDDEN") return traction;
    if (metricsVisibility === "HIDDEN") {
      return { ...traction, monthlyRevenueAmount: null, arrAmount: null, mrrAmount: null };
    }
    if (metricsVisibility === "EXACT") return traction;
    // BAND (default) — money fields become display strings, not comparable Decimals; this shape is for read/display only.
    return {
      ...traction,
      monthlyRevenueAmount: bandifyAmount(traction.monthlyRevenueAmount) as unknown as StartupTraction["monthlyRevenueAmount"],
      arrAmount: bandifyAmount(traction.arrAmount) as unknown as StartupTraction["arrAmount"],
      mrrAmount: bandifyAmount(traction.mrrAmount) as unknown as StartupTraction["mrrAmount"],
    };
  }

  /** Cash position and deal economics (burn, current raise, goal, valuation) are PRIV/INV per spec §12 — never in a public projection. */
  private projectFunding(funding: StartupFunding, isInvestor: boolean): StartupFunding {
    if (isInvestor) return funding;
    return {
      ...funding,
      monthlyBurnRateAmount: null,
      currentRaiseAmount: null,
      fundingGoalAmount: null,
      valuationAmount: null,
    };
  }
}
