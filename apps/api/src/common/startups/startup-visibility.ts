import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { MetricVisibility, Prisma, ProfileVisibility, StartupFunding, StartupTraction } from "@prisma/client";

import type { PrismaService } from "../../database/prisma/prisma.service";
import { isDemoViewer, sameSandbox } from "../demo/demo-scope";

/**
 * Who may see a startup, and how much of it. One file on purpose: every route
 * that returns somebody else's startup (the profile, discovery, search, an
 * investor's pipeline, watchlist, portfolio, mandates and recommendations)
 * goes through these functions, so a founder's "investors only", "stealth" and
 * "hide my numbers" choices hold everywhere and not only on the profile page.
 *
 * Plain functions rather than an injectable service, so any module can use
 * them without importing StartupsModule (which would be a cycle for the
 * investor modules it already imports).
 */

export interface StartupViewerContext {
  isOwner: boolean;
  isInvestor: boolean;
}

export interface ProjectableStartup {
  visibility: ProfileVisibility;
  metricsVisibility: MetricVisibility;
  isPublic?: boolean;
  deletedAt?: Date | null;
  traction?: StartupTraction | null;
  funding?: StartupFunding | null;
}

/** An investor looking at a startup that isn't theirs: the viewer behind every pipeline, watchlist, portfolio and mandate list. */
export const INVESTOR_VIEWER: StartupViewerContext = { isOwner: false, isInvestor: true };

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
 * Where-clause for "a startup that may appear in a list for this viewer":
 * public, not deleted, not private or stealth, and in the viewer's sandbox
 * (demo accounts only ever see demo startups, real ones never do).
 * INVESTOR_ONLY profiles pass, because the role isn't known to a shared query:
 * rows still go through `projectStartups` for the viewer.
 */
export function listableStartupWhere(viewerIsDemo: boolean): Prisma.StartupWhereInput {
  return {
    isPublic: true,
    deletedAt: null,
    visibility: { notIn: ["PRIVATE", "STEALTH"] },
    ...sameSandbox(viewerIsDemo),
  };
}

/**
 * The visibility gate on its own, for routes that expose a startup's related
 * data (timeline, activity feed) rather than the record itself. Those still
 * have to respect PRIVATE/STEALTH/INVESTOR_ONLY — otherwise a founder in
 * stealth leaks their milestones and updates through a side door while the
 * main profile route correctly 404s.
 */
export function assertStartupViewable(
  startup: Pick<ProjectableStartup, "visibility" | "isPublic" | "deletedAt">,
  viewer: StartupViewerContext,
): void {
  // A deleted profile is gone for everyone, its former owner included.
  if (startup.deletedAt) throw new NotFoundException("Startup not found");
  if (viewer.isOwner) return;
  if (startup.isPublic === false || startup.visibility === "PRIVATE" || startup.visibility === "STEALTH") {
    throw new NotFoundException("Startup not found");
  }
  if (startup.visibility === "INVESTOR_ONLY" && !viewer.isInvestor) {
    throw new ForbiddenException("This profile is visible to investors only");
  }
}

function projectTraction(traction: StartupTraction, metricsVisibility: MetricVisibility, isInvestor: boolean): StartupTraction {
  if (metricsVisibility === "HIDDEN") {
    return { ...traction, monthlyRevenueAmount: null, arrAmount: null, mrrAmount: null };
  }
  // Investors see exact figures (the deal-evaluation case Bundle 11 is built
  // around); everyone else gets the founder's chosen display mode.
  if (isInvestor || metricsVisibility === "EXACT") return traction;
  // BAND (default) — money fields become display strings, not comparable Decimals; this shape is for read/display only.
  return {
    ...traction,
    monthlyRevenueAmount: bandifyAmount(traction.monthlyRevenueAmount) as unknown as StartupTraction["monthlyRevenueAmount"],
    arrAmount: bandifyAmount(traction.arrAmount) as unknown as StartupTraction["arrAmount"],
    mrrAmount: bandifyAmount(traction.mrrAmount) as unknown as StartupTraction["mrrAmount"],
  };
}

/**
 * Cash position and deal economics are PRIV/INV per spec §12, never in a
 * public projection: burn, runway (burn's other face), the current raise, the
 * goal, the valuation and what the money is for. Past investors and the kind
 * of funding sought stay public, like on any startup profile.
 */
function projectFunding(funding: StartupFunding, isInvestor: boolean): StartupFunding {
  if (isInvestor) return funding;
  return {
    ...funding,
    monthlyBurnRateAmount: null,
    runwayMonths: null,
    currentRaiseAmount: null,
    fundingGoalAmount: null,
    valuationAmount: null,
    useOfFunds: null,
  };
}

/**
 * Bundle 30 — "the public profile is a curated, permission-filtered
 * projection — never the raw record." Every non-owner view of a startup goes
 * through this: it enforces the visibility gate (throwing like
 * `assertStartupViewable`) and bands or strips the financial fields.
 */
export function projectStartup<T extends ProjectableStartup>(startup: T, viewer: StartupViewerContext): T {
  assertStartupViewable(startup, viewer);
  if (viewer.isOwner) return startup;
  const traction = startup.traction ? projectTraction(startup.traction, startup.metricsVisibility, viewer.isInvestor) : startup.traction;
  const funding = startup.funding ? projectFunding(startup.funding, viewer.isInvestor) : startup.funding;
  return { ...startup, traction, funding };
}

/**
 * `projectStartup` for a list: rows the viewer may not see are dropped rather
 * than failing the whole page with a 403.
 */
export function projectStartups<T extends ProjectableStartup & { ownerId: string }>(
  startups: T[],
  viewer: { userId?: string | null; isInvestor: boolean },
): T[] {
  const visible: T[] = [];
  for (const startup of startups) {
    try {
      visible.push(projectStartup(startup, { isOwner: !!viewer.userId && startup.ownerId === viewer.userId, isInvestor: viewer.isInvestor }));
    } catch {
      // not viewable by this person — leave it out
    }
  }
  return visible;
}

/**
 * The startup behind `startupId`, if this viewer could have found it in
 * discovery; a 404 otherwise. Called before an investor adds a startup to a
 * pipeline, a watchlist or an alert, so knowing an id is never enough to pull
 * a private, stealth or other-sandbox profile into a list that then shows it.
 */
export async function findListableStartup(prisma: Pick<PrismaService, "startup" | "user">, startupId: string, viewerId: string) {
  const startup = await prisma.startup.findFirst({
    where: { id: startupId, AND: [listableStartupWhere(await isDemoViewer(prisma, viewerId))] },
  });
  if (!startup) throw new NotFoundException("Startup not found");
  return startup;
}
