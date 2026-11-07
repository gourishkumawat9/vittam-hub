import type { Metadata } from "next";

import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NO_INDEX };

/** Onboarding wizards render their own chrome via <WizardShell> — this layout only exists so the route group can share future cross-cutting concerns. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
