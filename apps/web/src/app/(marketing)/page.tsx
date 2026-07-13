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
const EcosystemDiagram = dynamic(() => import("@/components/marketing/EcosystemDiagram").then((m) => m.EcosystemDiagram), {
  loading: () => <SectionSkeleton />,
});
const DiscoverStartups = dynamic(() => import("@/components/marketing/DiscoverStartups").then((m) => m.DiscoverStartups), {
  loading: () => <SectionSkeleton />,
});
const FeaturedInvestors = dynamic(() => import("@/components/marketing/FeaturedInvestors").then((m) => m.FeaturedInvestors), {
  loading: () => <SectionSkeleton />,
});
const CommunitySection = dynamic(() => import("@/components/marketing/CommunitySection").then((m) => m.CommunitySection), {
  loading: () => <SectionSkeleton />,
});
const LearningHub = dynamic(() => import("@/components/marketing/LearningHub").then((m) => m.LearningHub), {
  loading: () => <SectionSkeleton />,
});
const TeamBuilder = dynamic(() => import("@/components/marketing/TeamBuilder").then((m) => m.TeamBuilder), {
  loading: () => <SectionSkeleton />,
});
const OfficeMarketplace = dynamic(() => import("@/components/marketing/OfficeMarketplace").then((m) => m.OfficeMarketplace), {
  loading: () => <SectionSkeleton />,
});
export const metadata: Metadata = {
  title: "Visibility for Tomorrow's Unicorns",
  description:
    "VittamHub is the digital identity platform for startups — build trust, showcase your journey, and connect with investors, mentors, incubators, and strategic partners in one ecosystem.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AudienceSection />
      <StartupJourney />
      <WhyVittamHub />
      <HowItWorks />
      <EcosystemDiagram />
      <DiscoverStartups />
      <FeaturedInvestors />
      <CommunitySection />
      <LearningHub />
      <TeamBuilder />
      <OfficeMarketplace />
      <CtaSection />
    </>
  );
}
