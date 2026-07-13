"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStoreState {
  /** Keyed by wizard section name (e.g. "startupInfo", "product") — mirrors the server's draft shape 1:1. */
  draft: Record<string, unknown>;
  step: number;
  setSectionData: (section: string, data: unknown) => void;
  setStep: (step: number) => void;
  hydrateFromServer: (draft: Record<string, unknown>, step: number) => void;
  reset: () => void;
}

/**
 * Client-side mirror of the server's onboarding draft — persisted to
 * localStorage so a page refresh or closed tab never loses progress before
 * the next autosave round-trip completes. The server (UserProfile.onboardingDraft)
 * remains the source of truth for *resuming on a different device*; this
 * store is what makes the current tab feel instant. See docs/11-onboarding-architecture.md.
 */
export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set) => ({
      draft: {},
      step: 0,
      setSectionData: (section, data) =>
        set((state) => ({ draft: { ...state.draft, [section]: data } })),
      setStep: (step) => set({ step }),
      hydrateFromServer: (draft, step) => set({ draft, step }),
      reset: () => set({ draft: {}, step: 0 }),
    }),
    { name: "vittamhub-onboarding-draft" },
  ),
);

/** Narrows a draft's JSON-typed section back to its step schema's shape — the draft is persisted as `unknown` because it's arbitrary JSON at rest. */
export function draftSection<T>(draft: Record<string, unknown>, section: string): Partial<T> | undefined {
  return draft[section] as Partial<T> | undefined;
}
