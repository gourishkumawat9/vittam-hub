import { Accordion, Badge } from "@vittamhub/ui";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "Pricing",
  description: "VittamHub pricing plans for startups and investors.",
};

const FREE_FEATURES = [
  "A verified public profile, live immediately after signup",
  "Full discovery search across startups, investors, mentors, incubators, and universities",
  "A monthly allotment of investor connect requests",
  "Trust Score with a full breakdown and next-best-actions",
];

const FAQ = [
  {
    value: "when-paid",
    question: "When will paid plans launch?",
    answer: "We haven't finalized pricing yet. The free plan above is what's live today, and we'll notify every account before anything changes.",
  },
  {
    value: "connect-limit",
    question: "How is the monthly connect request limit set?",
    answer: "It's configured centrally, not hardcoded per account, so it can change as the platform grows without needing a rebuild. You'll always see your current limit and usage on your dashboard.",
  },
  {
    value: "verification-cost",
    question: "Does verification cost anything?",
    answer: "No. Building your Trust Score through document verification, domain email checks, and confirmed relationships is free at every plan.",
  },
  {
    value: "future-plans",
    question: "What will paid plans include?",
    answer: "Likely candidates are higher connect-request limits, unlimited discovery, advanced recommendations, priority listing, deeper analytics, and investor CRM tools. Nothing is billed today, and none of this is available yet.",
  },
];

/**
 * A real page: the Free plan is described honestly (no invented request
 * count, since the limit is admin-configurable at runtime per CLAUDE.md §5,
 * not a fixed number safe to print here) and everything beyond it is
 * clearly labeled not-yet-available rather than presented as a live tier.
 */
export default function PricingPage() {
  return (
    <div className="mx-auto max-w-content px-6 py-24">
      <SectionHeading eyebrow="Pricing" title="Start free. Pricing tiers are still being finalized." />

      <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-card border border-brand-primary bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text-primary">Free</h2>
            <Badge variant="brand">Available now</Badge>
          </div>
          <p className="text-sm text-text-secondary">Everything you need to build a verified presence and start connecting.</p>
          <ul className="flex flex-col gap-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-2 rounded-button bg-brand-primary px-5 py-2.5 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started free
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-dashed border-border bg-background-secondary p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text-primary">Pro</h2>
            <Badge variant="neutral">Coming soon</Badge>
          </div>
          <p className="text-sm text-text-secondary">
            Higher connect limits, unlimited discovery, advanced recommendations, and priority listing, for teams ready to move faster.
          </p>
          <span className="mt-auto text-sm font-medium text-text-secondary">Pricing not yet set</span>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="mb-6 text-center font-heading text-xl font-semibold text-text-primary">Common questions</h2>
        <Accordion items={FAQ.map(({ value, question, answer }) => ({ value, question, answer }))} />
      </div>
    </div>
  );
}
