"use client";

import type { PersonalDetailsInput } from "@vittamhub/types";

import { PersonalDetailsStep } from "../role-steps/PersonalDetailsStep";

/** The founder's "About you": the shared personal step, worded for someone raising and looking for help. */
export function Step1PersonalDetails({ defaultValues, onNext }: { defaultValues?: Partial<PersonalDetailsInput>; onNext: () => void }) {
  return (
    <PersonalDetailsStep
      defaultValues={defaultValues}
      onNext={onNext}
      description="Investors and mentors meet the founder first. Your name, photo and a line about you are shown on your startup's page."
      linkedinHint="The quickest way for an investor to learn who you are"
      bioPlaceholder="Ex product lead at a payments company, building for small shop owners since 2024."
    />
  );
}
