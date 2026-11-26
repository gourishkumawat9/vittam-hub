import { Award, Compass, Handshake, Rocket } from "lucide-react";
import type { Metadata } from "next";

import { JoinBand } from "@/components/marketing/JoinBand";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PRODUCT_SHOTS } from "@/data/product-shots";

export const metadata: Metadata = {
  title: "About",
  description: "VittamHub's mission is a verified digital identity for every startup.",
};

const PRINCIPLES = [
  {
    icon: Rocket,
    title: "Founders first",
    description: "Built around what an early founder needs most: a clear profile, a mentor who has done it before, and a fair way to reach investors.",
  },
  {
    icon: Handshake,
    title: "Connect requests, not cold messages",
    description:
      "Founders never message an investor out of the blue. They send one request with what an investor needs to decide, and chat opens only when the investor accepts.",
  },
  {
    icon: Compass,
    title: "Automated, not gatekept",
    description: "There's no ops team sitting between you and a decision. Your profile is listed as soon as you publish it, and checks run automatically.",
  },
  {
    icon: Award,
    title: "Real progress over polish",
    description: "Metrics are stored as dated history, not overwritten. A startup's growth trend matters more than how the pitch reads today.",
  },
];

/**
 * Mission and product principles, drawn from how the platform is actually
 * built, not marketing copy. No
 * team or founder bios yet: CLAUDE.md §2 bans fabricated content and there's
 * no real team roster ready to publish.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About VittamHub"
        title="Every startup deserves a verified digital identity."
        intro="VittamHub helps founders build trust, gain visibility, and connect with investors and mentors, alongside a community of founders at their stage. We believe investors should discover startups through transparency, not cold outreach."
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

      <JoinBand />
    </>
  );
}
