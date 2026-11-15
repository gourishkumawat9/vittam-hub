"use client";

import type { CreateMentorInput, PersonalDetailsInput } from "@vittamhub/types";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { MentorInfoStep } from "@/components/onboarding/role-steps/MentorInfoStep";
import { PersonalDetailsStep } from "@/components/onboarding/role-steps/PersonalDetailsStep";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { draftSection } from "@/store/onboarding-store";

const STEPS: WizardStepMeta[] = [
  { id: "personal-details", label: "Personal info" },
  { id: "mentor-info", label: "Mentor profile" },
];

export default function MentorOnboardingPage() {
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  return (
    <WizardShell steps={STEPS} exitHref="/mentors/bookings" {...shell}>
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <MentorInfoStep defaultValues={draftSection<CreateMentorInput>(draft, "mentorInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
