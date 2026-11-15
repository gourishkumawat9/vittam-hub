"use client";

import type { TrustScore } from "@vittamhub/types";
import { Button, Card } from "@vittamhub/ui";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

/**
 * The dashboard's answer to "what should I do next?".
 *
 * Built from the Trust Score investors actually see: each row is one of its
 * signals that this startup hasn't earned yet, with the points that signal
 * is worth and a button that goes to the exact place it is done. Nothing is
 * listed that a founder can't complete today.
 *
 * (It used to read the stricter, not-yet-live scoring model, whose top three
 * suggestions were government-ID KYC, registry checks and a payment-gateway
 * link. None of those exist yet, and one button led to a page that 404'd.)
 */

interface ActionCopy {
  title: string;
  hint: string;
  cta: string;
  /** A page to go to. Left out for the milestone, which opens the dashboard's own dialog. */
  href?: string;
}

const ACTIONS: Record<string, ActionCopy> = {
  emailVerified: {
    title: "Confirm your email address",
    hint: "Enter the 6-digit code we emailed you. You can ask for a new one on the next screen.",
    cta: "Verify email",
    href: "/verify-email",
  },
  pitchDeck: {
    title: "Upload your pitch deck",
    hint: "It stays private. Each investor sees it only when you share it with them.",
    cta: "Upload deck",
    href: "/founder/documents",
  },
  companyRegistered: {
    title: "Show that your company is registered",
    hint: "If it already is, set the registration status to Registered on your startup profile.",
    cta: "Open startup info",
    href: "/onboarding/founder?step=startup-info",
  },
  website: {
    title: "Add your website",
    hint: "Investors look for it first. A simple landing page is enough.",
    cta: "Add website",
    href: "/onboarding/founder?step=startup-info",
  },
  linkedin: {
    title: "Add your LinkedIn profile",
    hint: "It lets an investor see who is behind the startup.",
    cta: "Add LinkedIn",
    href: "/onboarding/founder?step=personal-details",
  },
  productDemo: {
    title: "Add a product demo video",
    hint: "A link to a short screen recording of the product is enough.",
    cta: "Add demo",
    href: "/onboarding/founder?step=product",
  },
  profileCompletion: {
    title: "Bring your profile to 80% complete",
    hint: "The Profile Completion card below lists what is still missing.",
    cta: "See what's missing",
    href: "#profile-completion",
  },
  phoneProvided: {
    title: "Add a phone number",
    hint: "It is never shown on your public profile.",
    cta: "Add phone",
    href: "/onboarding/founder?step=personal-details",
  },
  founderDetails: {
    title: "Add your bio and city",
    hint: "Two lines about you and where you are based.",
    cta: "Add details",
    href: "/onboarding/founder?step=personal-details",
  },
  timeline: {
    title: "Add your first milestone",
    hint: "A launch, a first customer, a grant: anything that really happened.",
    cta: "Add milestone",
  },
};

const MAX_SHOWN = 3;

export function NextActionsCard({ trustScore, onAddMilestone }: { trustScore: TrustScore; onAddMilestone: () => void }) {
  // Biggest gain first. A signal this card has no words for is left out rather than shown half-explained.
  const open = trustScore.factors.filter((factor) => !factor.earned && ACTIONS[factor.key]).sort((a, b) => b.weight - a.weight);
  const actions = open.slice(0, MAX_SHOWN);

  if (actions.length === 0) {
    return (
      <Card className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success-600" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-text-primary">Nothing outstanding</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Your profile has everything the Trust Score looks for. Keep your numbers and milestones current so it stays that way.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-text-primary">Your next actions</h2>
        </div>
        {open.length > actions.length && (
          <span className="shrink-0 text-xs text-text-secondary">
            {actions.length} of {open.length} open
          </span>
        )}
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {actions.map((factor) => {
          const action = ACTIONS[factor.key]!;
          return (
            <li key={factor.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{action.title}</p>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    +{factor.weight} to your Trust Score
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">{action.hint}</p>
              </div>
              {action.href ? (
                <Button size="sm" variant="secondary" asChild className="shrink-0 self-start sm:self-auto">
                  <Link href={action.href}>
                    {action.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={onAddMilestone} className="shrink-0 self-start sm:self-auto">
                  {action.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
