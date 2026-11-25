"use client";

import type { CreateUniversityInput, PersonalDetailsInput } from "@vittamhub/types";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { PersonalDetailsStep } from "@/components/onboarding/role-steps/PersonalDetailsStep";
import { UniversityInfoStep } from "@/components/onboarding/role-steps/UniversityInfoStep";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { draftSection } from "@/store/onboarding-store";

const STEPS: WizardStepMeta[] = [
  { id: "personal-details", label: "Personal info" },
  { id: "university-info", label: "Institution profile" },
];

export default function UniversityOnboardingPage() {
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  return (
    <WizardShell steps={STEPS} exitHref="/home" {...shell}>
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <UniversityInfoStep defaultValues={draftSection<CreateUniversityInput>(draft, "universityInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
