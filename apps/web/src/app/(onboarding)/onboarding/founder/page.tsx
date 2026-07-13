"use client";

import { useOnboardingState } from "@vittamhub/api-client";
import {
  STARTUP_WIZARD_STEPS,
  type FundingStepInput,
  type MarketStepInput,
  type PersonalDetailsInput,
  type PreferencesStepInput,
  type ProductStepInput,
  type StartupInfoStepInput,
  type TeamStepInput,
  type TractionStepInput,
  type VerificationStepInput,
} from "@vittamhub/types";
import { useEffect, useState } from "react";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { Step10Review } from "@/components/onboarding/founder-steps/Step10Review";
import { Step1PersonalDetails } from "@/components/onboarding/founder-steps/Step1PersonalDetails";
import { Step2StartupInfo } from "@/components/onboarding/founder-steps/Step2StartupInfo";
import { Step3Product } from "@/components/onboarding/founder-steps/Step3Product";
import { Step4Market } from "@/components/onboarding/founder-steps/Step4Market";
import { Step5Team } from "@/components/onboarding/founder-steps/Step5Team";
import { Step6Traction } from "@/components/onboarding/founder-steps/Step6Traction";
import { Step7Funding } from "@/components/onboarding/founder-steps/Step7Funding";
import { Step8Verification } from "@/components/onboarding/founder-steps/Step8Verification";
import { Step9Preferences } from "@/components/onboarding/founder-steps/Step9Preferences";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

const STEP_LABELS: Record<(typeof STARTUP_WIZARD_STEPS)[number], string> = {
  "personal-details": "Founder info",
  "startup-info": "Startup info",
  product: "Product",
  market: "Market",
  team: "Team",
  traction: "Traction",
  funding: "Funding",
  verification: "Verification",
  preferences: "Preferences",
  review: "Review & publish",
};

const STEPS: WizardStepMeta[] = STARTUP_WIZARD_STEPS.map((id) => ({ id, label: STEP_LABELS[id] }));

export default function FounderOnboardingPage() {
  const { data: serverState } = useOnboardingState();
  const { draft, step, setStep, hydrateFromServer } = useOnboardingStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!serverState || hydrated) return;
    // Only hydrate from the server if this browser has no local draft yet
    // (a fresh device) — otherwise the locally persisted draft, which is
    // always at least as fresh, wins.
    if (Object.keys(draft).length === 0 && serverState.draft) {
      hydrateFromServer(serverState.draft, serverState.step);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when server state first arrives
  }, [serverState]);

  const goNext = () => setStep(Math.min(step + 1, STEPS.length - 1));
  const goBack = () => setStep(Math.max(step - 1, 0));

  const currentStepId = STARTUP_WIZARD_STEPS[step];

  return (
    <WizardShell steps={STEPS} currentStepIndex={step} onStepSelect={setStep}>
      {currentStepId === "personal-details" && (
        <Step1PersonalDetails defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {currentStepId === "startup-info" && (
        <Step2StartupInfo defaultValues={draftSection<StartupInfoStepInput>(draft, "startupInfo")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "product" && (
        <Step3Product defaultValues={draftSection<ProductStepInput>(draft, "product")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "market" && (
        <Step4Market defaultValues={draftSection<MarketStepInput>(draft, "market")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "team" && (
        <Step5Team defaultValues={draftSection<TeamStepInput>(draft, "team")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "traction" && (
        <Step6Traction defaultValues={draftSection<TractionStepInput>(draft, "traction")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "funding" && (
        <Step7Funding defaultValues={draftSection<FundingStepInput>(draft, "funding")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "verification" && (
        <Step8Verification defaultValues={draftSection<VerificationStepInput>(draft, "verification")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "preferences" && (
        <Step9Preferences defaultValues={draftSection<PreferencesStepInput>(draft, "preferences")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "review" && <Step10Review onBack={goBack} />}
    </WizardShell>
  );
}
