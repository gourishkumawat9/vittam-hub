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
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  return (
    <WizardShell steps={STEPS} exitHref="/community" {...shell}>
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <IncubatorInfoStep defaultValues={draftSection<CreateIncubatorInput>(draft, "incubatorInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
