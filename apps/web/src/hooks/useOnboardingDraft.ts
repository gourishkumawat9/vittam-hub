"use client";

import { useCurrentUser, useOnboardingState } from "@vittamhub/api-client";
import { OnboardingStatus } from "@vittamhub/types";
import { useEffect } from "react";

import { useOnboardingStore } from "@/store/onboarding-store";

/**
 * Loads the wizard's draft for the person signed in, and drives its steps.
 *
 * The draft always comes from the server, freshly fetched, and nothing is
 * shown until it has arrived for this account. Once a profile is live the
 * server answers with the profile itself as the draft, which is what makes
 * the wizard double as "Edit profile".
 */
export function useOnboardingDraft(stepCount: number) {
  const { data: user } = useCurrentUser();
  const { data: serverState, isFetchedAfterMount, isError, refetch } = useOnboardingState();
  const { ownerId, draft, step, autosaveStatus, setStep, hydrate } = useOnboardingStore();

  const ready = !!user && ownerId === user.id;

  useEffect(() => {
    // Wait for an answer fetched for this visit: a cached one could be the
    // draft as it stood before the profile was last published.
    if (!user || !serverState || !isFetchedAfterMount) return;
    if (ownerId === user.id) return; // already loaded for this person in this tab
    hydrate(user.id, serverState.draft ?? {}, Math.min(serverState.step, stepCount - 1));
  }, [user, serverState, isFetchedAfterMount, ownerId, hydrate, stepCount]);

  return {
    ready,
    failed: isError && !ready,
    retry: refetch,
    draft: ready ? draft : {},
    step: ready ? Math.min(step, stepCount - 1) : 0,
    setStep,
    goNext: () => setStep(Math.min(step + 1, stepCount - 1)),
    goBack: () => setStep(Math.max(step - 1, 0)),
    autosaveStatus,
    /** The profile is already live: this visit edits it, it doesn't create it. */
    isEditing: serverState?.status === OnboardingStatus.COMPLETED,
  };
}
