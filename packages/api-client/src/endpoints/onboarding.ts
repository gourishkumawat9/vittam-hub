import type { OnboardingState, SaveOnboardingDraftInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export const onboardingApi = {
  getState: () => apiRequest<OnboardingState>("/v1/onboarding/state"),
  saveDraft: (input: SaveOnboardingDraftInput) =>
    apiRequest<{ saved: boolean; step: number }>("/v1/onboarding/draft", { method: "PATCH", body: input }),
  /** Throws away unsaved wizard edits to a profile that is already live. */
  discardEdits: () => apiRequest<{ discarded: boolean }>("/v1/onboarding/draft", { method: "DELETE" }),
  publish: (body: Record<string, unknown>) =>
    apiRequest<{ id: string }>("/v1/onboarding/publish", { method: "POST", body }),
};
