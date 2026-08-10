"use client";

import type { TrustV2Preview } from "@vittamhub/types";
import { Button, Card } from "@vittamhub/ui";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

/**
 * The dashboard's answer to "what should I do next?".
 *
 * Everything here is derived from the trust engine's real next-best-actions
 * (score gap per component at this startup's stage) — no invented tasks, and
 * no action is shown once its component is already maxed out. Each row states
 * the points genuinely available so the ask is always justified before it's
 * made, per the product's own "show the benefit before asking" rule.
 */

/** Where a founder actually goes to close each trust component's gap. */
const ACTION_DESTINATIONS: Record<string, { href: string; cta: string }> = {
  registration: { href: "/onboarding/founder", cta: "Add registration details" },
  companyDepth: { href: "/onboarding/founder", cta: "Complete your profile" },
  founder: { href: "/founder/settings", cta: "Verify your identity" },
  product: { href: "/onboarding/founder", cta: "Add product details" },
  legal: { href: "/founder/documents", cta: "Upload legal documents" },
  revenue: { href: "/founder/analytics", cta: "Add traction data" },
  funding: { href: "/onboarding/founder", cta: "Add funding history" },
  transparency: { href: "/founder/documents", cta: "Share documents" },
  freshness: { href: "/founder", cta: "Post an update" },
};

const FALLBACK = { href: "/onboarding/founder", cta: "Update profile" };

export function NextActionsCard({ preview }: { preview: TrustV2Preview }) {
  // Only surface actions that can actually move the score, biggest gap first.
  const actions = preview.nextBestActions.filter((a) => a.gap > 0).slice(0, 3);

  if (actions.length === 0) {
    return (
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success-600" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-text-primary">Nothing outstanding</h2>
        </div>
        <p className="text-sm text-text-secondary">
          You&apos;ve proven everything a {preview.stage.toLowerCase().replace(/_/g, " ")}-stage startup can prove right now. Keep your
          profile and metrics current so your score doesn&apos;t drift.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-text-primary">Your next actions</h2>
        </div>
        <span className="shrink-0 text-xs text-text-secondary">Trust {preview.score}/100</span>
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {actions.map((action) => {
          const destination = ACTION_DESTINATIONS[action.key] ?? FALLBACK;
          return (
            <li key={action.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{action.label}</p>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                    +{Math.round(action.gap)} pts
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">{action.suggestion}</p>
              </div>
              <Button size="sm" variant="secondary" asChild className="shrink-0 self-start sm:self-auto">
                <Link href={destination.href}>
                  {destination.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
