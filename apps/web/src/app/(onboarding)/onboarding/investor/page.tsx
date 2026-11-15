"use client";

import type { CreateInvestorInput, PersonalDetailsInput } from "@vittamhub/types";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { InvestorInfoStep } from "@/components/onboarding/role-steps/InvestorInfoStep";
import { PersonalDetailsStep } from "@/components/onboarding/role-steps/PersonalDetailsStep";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { draftSection } from "@/store/onboarding-store";

const STEPS: WizardStepMeta[] = [
  { id: "personal-details", label: "Personal info" },
  { id: "investor-info", label: "Investor profile" },
];

export default function InvestorOnboardingPage() {
  const { shell, draft, step, goNext, goBack, isEditing } = useOnboardingDraft(STEPS);

  return (
    <WizardShell steps={STEPS} exitHref="/investor" {...shell}>
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <InvestorInfoStep defaultValues={draftSection<CreateInvestorInput>(draft, "investorInfo")} onBack={goBack} isEditing={isEditing} />
      )}
    </WizardShell>
  );
}
