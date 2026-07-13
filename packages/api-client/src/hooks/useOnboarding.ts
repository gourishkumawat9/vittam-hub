"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { onboardingApi } from "../endpoints/onboarding";

const onboardingStateKey = ["onboarding", "state"] as const;

export function useOnboardingState() {
  return useQuery({ queryKey: onboardingStateKey, queryFn: onboardingApi.getState, staleTime: 0 });
}

export function useSaveOnboardingDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.saveDraft,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingStateKey }),
  });
}

export function usePublishOnboarding() {
  return useMutation({ mutationFn: onboardingApi.publish });
}
