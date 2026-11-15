"use client";

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
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { draftSection } from "@/store/onboarding-store";

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
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  const currentStepId = STARTUP_WIZARD_STEPS[step];

  return (
    <WizardShell steps={STEPS} exitHref="/founder" {...shell}>
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
      {currentStepId === "review" && <Step10Review onBack={goBack} isEditing={isEditing} />}
    </WizardShell>
  );
}
