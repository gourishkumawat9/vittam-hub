"use client";

import { useOnboardingState } from "@vittamhub/api-client";
import { MemberPersona, isOrganisationPersona } from "@vittamhub/types";

/**
 * Who the person said they are at sign-up (a student, someone exploring an
 * idea, an investment firm…), so a wizard step can word itself for them.
 * Accounts made before personas existed get their role's usual one.
 */
export function usePersona() {
  const { data } = useOnboardingState();
  const persona = data?.persona ?? null;
  return {
    persona,
    isOrganisation: isOrganisationPersona(persona),
    /** Someone with an idea rather than a company yet: an explorer or a student. */
    isIdeaStage: persona === MemberPersona.EXPLORER || persona === MemberPersona.STUDENT,
    isStudent: persona === MemberPersona.STUDENT,
  };
}
