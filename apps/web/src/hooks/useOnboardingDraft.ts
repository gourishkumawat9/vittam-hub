"use client";

import { useCurrentUser, useDiscardOnboardingEdits, useOnboardingState } from "@vittamhub/api-client";
import { OnboardingStatus } from "@vittamhub/types";
import { useEffect, useMemo, useRef, useState } from "react";

import { useOnboardingStore } from "@/store/onboarding-store";

/**
 * Loads the wizard's draft for the person signed in, and drives its steps.
 *
 * The draft always comes from the server, freshly fetched, and nothing is
 * shown until it has arrived for this account. Once a profile is live the
 * server answers with the profile itself as the draft, which is what makes
 * the wizard double as "Edit profile".
 *
 * `stepIds` lets a link open the wizard on one step of a live profile
 * (`/onboarding/founder?step=team`), which is how the dashboard's "Fix" links
 * take a founder straight to the thing that is missing.
 */
export function useOnboardingDraft(steps: readonly { id: string }[]) {
  const stepCount = steps.length;
  // Step lists are module constants, so this is computed once per wizard.
  const stepIds = useMemo(() => steps.map((item) => item.id), [steps]);
  const { data: user } = useCurrentUser();
  const { data: serverState, isFetchedAfterMount, isError, refetch } = useOnboardingState();
  const discard = useDiscardOnboardingEdits();
  const { ownerId, draft, step, autosaveStatus, pendingEdits, setStep, hydrate } = useOnboardingStore();
  const [isDiscarding, setIsDiscarding] = useState(false);
  const openedRequestedStep = useRef(false);

  const ready = !!user && ownerId === user.id;
  const isEditing = serverState?.status === OnboardingStatus.COMPLETED;

  useEffect(() => {
    // Wait for an answer fetched for this visit: a cached one could be the
    // draft as it stood before the profile was last published.
    if (!user || !serverState || !isFetchedAfterMount) return;
    if (ownerId === user.id) return; // already loaded for this person in this tab
    hydrate(user.id, serverState.draft ?? {}, Math.min(serverState.step, stepCount - 1), {
      editing: serverState.status === OnboardingStatus.COMPLETED,
      pendingEdits: serverState.pendingEdits === true,
    });
  }, [user, serverState, isFetchedAfterMount, ownerId, hydrate, stepCount]);

  useEffect(() => {
    if (!ready || !isEditing || openedRequestedStep.current) return;
    openedRequestedStep.current = true;
    // Read from the address bar rather than useSearchParams, which would
    // force every wizard page out of static rendering for one optional link.
    const requested = new URLSearchParams(window.location.search).get("step");
    const index = requested ? stepIds.indexOf(requested) : -1;
    if (index >= 0) setStep(index);
  }, [ready, isEditing, stepIds, setStep]);

  /** Throws away unsaved changes to a live profile and reloads what is published. */
  const discardEdits = async () => {
    if (!user || isDiscarding) return;
    setIsDiscarding(true);
    try {
      await discard.mutateAsync();
      const fresh = await refetch();
      if (fresh.data) {
        hydrate(user.id, fresh.data.draft ?? {}, Math.min(step, stepCount - 1), { editing: true, pendingEdits: false });
      }
    } catch {
      // The failed request has already shown its own message; the edits are still there.
    } finally {
      setIsDiscarding(false);
    }
  };

  const currentStep = ready ? Math.min(step, stepCount - 1) : 0;
  const showPendingEdits = ready && isEditing && pendingEdits;

  return {
    draft: ready ? draft : {},
    step: currentStep,
    goNext: () => setStep(Math.min(step + 1, stepCount - 1)),
    goBack: () => setStep(Math.max(step - 1, 0)),
    /** The profile is already live: this visit edits it, it doesn't create it. */
    isEditing,
    /** Everything WizardShell needs, so each wizard page passes it on in one go. */
    shell: {
      currentStepIndex: currentStep,
      onStepSelect: setStep,
      autosaveStatus,
      isEditing,
      ready,
      failed: isError && !ready,
      onRetry: () => void refetch(),
      pendingEdits: showPendingEdits,
      onDiscardEdits: () => void discardEdits(),
      isDiscarding,
    },
  };
}
