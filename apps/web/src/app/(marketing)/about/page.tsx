import { Award, Blocks, Compass, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { EcosystemDiagram } from "@/components/marketing/EcosystemDiagram";
import { JoinBand } from "@/components/marketing/JoinBand";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { WhyVittamHub } from "@/components/marketing/WhyVittamHub";
import { PRODUCT_SHOTS } from "@/data/product-shots";

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
    description:
      "Startups, investors, mentors, incubators and universities all go through the same verification model. Protecting founders from fake investors matters as much as verifying startups.",
  },
  {
    icon: Compass,
    title: "Automated, not gatekept",
    description:
      "There's no ops team sitting between you and a decision. Verification runs through automated checks and two-sided confirmation, not a manual review queue.",
  },
  {
    icon: Award,
    title: "Real progress over polish",
    description: "Metrics are stored as dated history, not overwritten. A startup's growth trend matters more than how the pitch reads today.",
  },
];

/**
 * Mission, product principles (drawn from how the platform is actually
 * built, not marketing copy), the building blocks and the ecosystem map. No
 * team or founder bios yet: CLAUDE.md §2 bans fabricated content and there's
 * no real team roster ready to publish.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About VittamHub"
        title="Every startup deserves a verified digital identity."
        intro="VittamHub helps founders build trust, gain visibility, and connect with investors, mentors, incubators and universities through one integrated ecosystem. We believe investors should discover startups through transparency, not cold outreach."
        image={PRODUCT_SHOTS.startupProfile}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
          <SectionHeading eyebrow="What we stand for" title="The principles the platform is built on" />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex flex-col gap-3 border-t-2 border-brand-primary pt-6">
                <Icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
                <h3 className="font-heading text-xl font-bold text-text-primary">{title}</h3>
                <p className="leading-relaxed text-text-secondary">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <EcosystemDiagram />
      <WhyVittamHub />
      <JoinBand />
    </>
  );
}
