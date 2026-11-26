"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { onboardingApi } from "../endpoints/onboarding";

const onboardingStateKey = ["onboarding", "state"] as const;

export function useOnboardingState() {
  return useQuery({ queryKey: onboardingStateKey, queryFn: onboardingApi.getState, staleTime: 0 });
}

/** The dashboard's "profile strength" card. Publishing marks it stale with everything else. */
export function useProfileStrength() {
  return useQuery({ queryKey: ["onboarding", "strength"], queryFn: onboardingApi.getStrength });
}

/**
 * Autosave. Doesn't refetch the state afterwards: the wizard holds the
 * freshest copy itself, and a fetch after every keystroke's save was a
 * second request for nothing.
 */
export function useSaveOnboardingDraft() {
  return useMutation({ mutationFn: onboardingApi.saveDraft });
}

export function useDiscardOnboardingEdits() {
  return useMutation({ mutationFn: onboardingApi.discardEdits });
}

/**
 * Publishing changes what almost every screen shows (the dashboard, the
 * public profile, "finish onboarding" prompts), so everything cached is
 * marked stale. The caller shows the error inline, hence the empty handler:
 * it opts out of the app-wide error toast.
 */
export function usePublishOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.publish,
    onSuccess: () => queryClient.invalidateQueries(),
    onError: () => undefined,
  });
}
