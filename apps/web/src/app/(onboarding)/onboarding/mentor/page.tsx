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
  const { ready, failed, retry, draft, step, setStep, goNext, goBack, autosaveStatus, isEditing } = useOnboardingDraft(STEPS.length);

  return (
    <WizardShell
      steps={STEPS}
      currentStepIndex={step}
      onStepSelect={setStep}
      autosaveStatus={autosaveStatus}
      isEditing={isEditing}
      exitHref="/mentors/bookings"
      ready={ready}
      failed={failed}
      onRetry={retry}
    >
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <MentorInfoStep defaultValues={draftSection<CreateMentorInput>(draft, "mentorInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
