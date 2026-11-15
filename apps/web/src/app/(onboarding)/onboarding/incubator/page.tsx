"use client";

import type { CreateIncubatorInput, PersonalDetailsInput } from "@vittamhub/types";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { IncubatorInfoStep } from "@/components/onboarding/role-steps/IncubatorInfoStep";
import { PersonalDetailsStep } from "@/components/onboarding/role-steps/PersonalDetailsStep";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { draftSection } from "@/store/onboarding-store";

const STEPS: WizardStepMeta[] = [
  { id: "personal-details", label: "Personal info" },
  { id: "incubator-info", label: "Organization profile" },
];

export default function IncubatorOnboardingPage() {
  const { ready, failed, retry, draft, step, setStep, goNext, goBack, autosaveStatus, isEditing } = useOnboardingDraft(STEPS.length);

  return (
    <WizardShell
      steps={STEPS}
      currentStepIndex={step}
      onStepSelect={setStep}
      autosaveStatus={autosaveStatus}
      isEditing={isEditing}
      exitHref="/community"
      ready={ready}
      failed={failed}
      onRetry={retry}
    >
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <IncubatorInfoStep defaultValues={draftSection<CreateIncubatorInput>(draft, "incubatorInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
