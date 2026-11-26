import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { AudienceSection } from "@/components/marketing/AudienceSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { SectionSkeleton } from "@/components/marketing/SectionSkeleton";
import { StartupJourney } from "@/components/marketing/StartupJourney";
import { WhyVittamHub } from "@/components/marketing/WhyVittamHub";

// Below-the-fold sections are dynamically imported so the initial bundle stays
// lean — see docs/10-deployment-infrastructure.md's performance section.
const DiscoverStartups = dynamic(() => import("@/components/marketing/DiscoverStartups").then((m) => m.DiscoverStartups), {
  loading: () => <SectionSkeleton />,
});
const FeaturedInvestors = dynamic(() => import("@/components/marketing/FeaturedInvestors").then((m) => m.FeaturedInvestors), {
  loading: () => <SectionSkeleton />,
});
const CommunitySection = dynamic(() => import("@/components/marketing/CommunitySection").then((m) => m.CommunitySection), {
  loading: () => <SectionSkeleton />,
});
const FaqSection = dynamic(() => import("@/components/marketing/FaqSection").then((m) => m.FaqSection), {
  loading: () => <SectionSkeleton />,
});
export const metadata: Metadata = {
  title: "Visibility for Tomorrow's Unicorns",
  description:
    "VittamHub is the digital identity platform for startups. Build a profile investors can read in a minute, learn from mentors, and grow with a community of founders.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AudienceSection />
      <StartupJourney />
      <WhyVittamHub />
      <HowItWorks />
      <DiscoverStartups />
      <FeaturedInvestors />
      <CommunitySection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
