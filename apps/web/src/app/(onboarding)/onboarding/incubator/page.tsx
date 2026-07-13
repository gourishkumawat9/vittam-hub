"use client";

import { useOnboardingState } from "@vittamhub/api-client";
import type { CreateIncubatorInput, PersonalDetailsInput } from "@vittamhub/types";
import { useEffect, useState } from "react";

import { WizardShell, type WizardStepMeta } from "@/components/onboarding/WizardShell";
import { IncubatorInfoStep } from "@/components/onboarding/role-steps/IncubatorInfoStep";
import { PersonalDetailsStep } from "@/components/onboarding/role-steps/PersonalDetailsStep";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

const STEPS: WizardStepMeta[] = [
  { id: "personal-details", label: "Personal info" },
  { id: "incubator-info", label: "Organization profile" },
];

export default function IncubatorOnboardingPage() {
  const { data: serverState } = useOnboardingState();
  const { draft, step, setStep, hydrateFromServer } = useOnboardingStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!serverState || hydrated) return;
    if (Object.keys(draft).length === 0 && serverState.draft) {
      hydrateFromServer(serverState.draft, serverState.step);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when server state first arrives
  }, [serverState]);

  const goNext = () => setStep(Math.min(step + 1, STEPS.length - 1));
  const goBack = () => setStep(Math.max(step - 1, 0));

  return (
    <WizardShell steps={STEPS} currentStepIndex={step} onStepSelect={setStep}>
      {step === 0 && (
        <PersonalDetailsStep defaultValues={draftSection<PersonalDetailsInput>(draft, "personalDetails")} onNext={goNext} />
      )}
      {step === 1 && (
        <IncubatorInfoStep defaultValues={draftSection<CreateIncubatorInput>(draft, "incubatorInfo")} onBack={goBack} />
      )}
    </WizardShell>
  );
}
