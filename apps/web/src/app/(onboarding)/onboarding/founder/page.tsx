"use client";

import {
  STARTUP_OPTIONAL_STEPS,
  STARTUP_WIZARD_STEPS,
  type FundingStepInput,
  type MarketStepInput,
  type PersonalDetailsInput,
  type PreferencesStepInput,
  type ProductStepInput,
  type StartupInfoStepInput,
  type StartupWizardStep,
  type TeamStepInput,
  type TractionStepInput,
  type VerificationStepInput,
} from "@vittamhub/types";
import { useMemo } from "react";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { hasAny } from "@/components/onboarding/fields";
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

const STEP_LABELS: Record<StartupWizardStep, string> = {
  "personal-details": "About you",
  "startup-info": "Your startup",
  preferences: "What you need",
  review: "Review and publish",
  product: "Product",
  traction: "Traction",
  team: "Team",
  funding: "Funding",
  market: "Market",
  verification: "Documents",
};

const OPTIONAL = new Set<string>(STARTUP_OPTIONAL_STEPS);
const STEPS: WizardStepMeta[] = STARTUP_WIZARD_STEPS.map((id) => ({ id, label: STEP_LABELS[id], optional: OPTIONAL.has(id) }));
const REVIEW_INDEX = STARTUP_WIZARD_STEPS.indexOf("review");

/** Whether an optional section holds anything a founder typed or uploaded (defaults alone don't count). */
function sectionHasContent(draft: Record<string, unknown>, id: StartupWizardStep): boolean {
  const section = (draft[id] as Record<string, unknown> | undefined) ?? {};
  switch (id) {
    case "team": {
      const members = (section.members as unknown[] | undefined) ?? [];
      return members.length > 0 || hasAny([section.openRoles]);
    }
    case "verification":
      return hasAny([section.documents]);
    case "product":
      return hasAny(Object.entries(section).filter(([key]) => key !== "hasApi").map(([, value]) => value));
    default:
      return hasAny(Object.values(section));
  }
}

export default function FounderOnboardingPage() {
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  const steps = useMemo(
    () => STEPS.map((meta) => (meta.optional ? { ...meta, done: sectionHasContent(draft, meta.id as StartupWizardStep) } : meta)),
    [draft],
  );

  const currentStepId = STARTUP_WIZARD_STEPS[step];
  const toReview = () => shell.onStepSelect(REVIEW_INDEX);
  const goToStep = (id: StartupWizardStep) => shell.onStepSelect(STARTUP_WIZARD_STEPS.indexOf(id));
  // An optional section opens from review (or the step list) and returns there.
  const optionalNav = { onNext: toReview, onBack: toReview };

  return (
    <WizardShell steps={steps} exitHref="/founder" {...shell}>
      {currentStepId === "personal-details" && (
        <Step1PersonalDetails defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {currentStepId === "startup-info" && (
        <Step2StartupInfo defaultValues={draftSection<StartupInfoStepInput>(draft, "startupInfo")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "preferences" && (
        <Step9Preferences defaultValues={draftSection<PreferencesStepInput>(draft, "preferences")} onNext={goNext} onBack={goBack} />
      )}
      {currentStepId === "review" && <Step10Review onBack={goBack} isEditing={isEditing} goToStep={goToStep} optionalSteps={steps.filter((s) => s.optional)} />}
      {currentStepId === "product" && <Step3Product defaultValues={draftSection<ProductStepInput>(draft, "product")} {...optionalNav} />}
      {currentStepId === "traction" && <Step6Traction defaultValues={draftSection<TractionStepInput>(draft, "traction")} {...optionalNav} />}
      {currentStepId === "team" && <Step5Team defaultValues={draftSection<TeamStepInput>(draft, "team")} {...optionalNav} />}
      {currentStepId === "funding" && <Step7Funding defaultValues={draftSection<FundingStepInput>(draft, "funding")} {...optionalNav} />}
      {currentStepId === "market" && <Step4Market defaultValues={draftSection<MarketStepInput>(draft, "market")} {...optionalNav} />}
      {currentStepId === "verification" && (
        <Step8Verification defaultValues={draftSection<VerificationStepInput>(draft, "verification")} {...optionalNav} />
      )}
    </WizardShell>
  );
}
