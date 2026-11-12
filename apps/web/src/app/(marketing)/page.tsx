import type { Metadata } from "next";

import { AudienceSection } from "@/components/marketing/AudienceSection";
import { CommunitySection } from "@/components/marketing/CommunitySection";
import { ConnectRequestsBand } from "@/components/marketing/ConnectRequestsBand";
import { CtaTiles } from "@/components/marketing/CtaTiles";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IntroSection } from "@/components/marketing/IntroSection";
import { JoinBand } from "@/components/marketing/JoinBand";
import { StartupJourney } from "@/components/marketing/StartupJourney";

export const metadata: Metadata = {
  title: "Visibility for Tomorrow's Unicorns",
  description:
    "VittamHub is the digital identity platform for startups. Build trust, show your journey, and connect with investors, mentors, incubators and universities in one ecosystem.",
};

/**
 * The home page follows the BCG careers site's structure: navy hero, intro
 * statement, audience cards, a grid to find your place, a navy feature band,
 * a split feature block, closing tiles and a join band. Every section is
 * server-rendered; only the hero film runs code in the browser.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <AudienceSection />
      <StartupJourney />
      <HowItWorks />
      <ConnectRequestsBand />
      <CommunitySection />
      <CtaTiles />
      <JoinBand />
    </>
  );
}
