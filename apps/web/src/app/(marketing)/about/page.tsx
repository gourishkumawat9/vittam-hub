import { Award, Blocks, Compass, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "About",
  description: "VittamHub's mission is a verified digital identity for every startup.",
};

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Trust is earned, not typed",
    description: "A profile's Trust Score rises only through verification and real evidence. Typing a claim never raises it on its own.",
  },
  {
    icon: Blocks,
    title: "Every entity gets verified",
    description: "Startups, investors, mentors, incubators, universities, and service providers all go through the same verification model. Protecting founders from fake investors matters as much as verifying startups.",
  },
  {
    icon: Compass,
    title: "Automated, not gatekept",
    description: "There's no ops team sitting between you and a decision. Verification runs through automated checks and two-sided confirmation, not a manual review queue.",
  },
  {
    icon: Award,
    title: "Real progress over polish",
    description: "Metrics are stored as dated history, not overwritten. A startup's growth trend matters more than how the pitch reads today.",
  },
];

/**
 * A real page, not a stub: mission, product principles (drawn directly from
 * how the platform is actually built, not marketing copy), and a link into
 * the ecosystem diagram already on the landing page rather than re-explaining
 * it here. No team/founder bios yet, since CLAUDE.md §2 bans fabricated
 * content and there's no real team roster ready to publish.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-content px-6 py-24">
      <SectionHeading
        eyebrow="About VittamHub"
        title="Every startup deserves a verified digital identity."
        description="VittamHub helps founders build trust, gain visibility, and connect with investors, mentors, incubators, universities, and strategic partners through one integrated ecosystem. We believe investors should discover startups through transparency, not cold outreach."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {PRINCIPLES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
            </span>
            <h3 className="font-heading text-base font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-card border border-border bg-background-secondary px-8 py-12 text-center">
        <h2 className="font-heading text-2xl font-semibold text-text-primary">See how the ecosystem connects</h2>
        <p className="max-w-lg text-sm text-text-secondary">
          Founders, investors, mentors, incubators, universities, and service providers, all in one hub.
        </p>
        <Link href="/#ecosystem" className="text-sm font-medium text-brand-primary hover:underline">
          View the ecosystem diagram →
        </Link>
      </div>
    </div>
  );
}
