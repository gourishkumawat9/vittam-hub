"use client";

import type { OnboardingDraftSection } from "@vittamhub/types";
import { create } from "zustand";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface OnboardingStoreState {
  /** Whose answers these are. The wizard only shows a draft loaded for the person signed in now. */
  ownerId: string | null;
  /** Keyed by wizard section name (e.g. "startupInfo", "product") — mirrors the server's draft shape 1:1. */
  draft: Record<string, unknown>;
  step: number;
  autosaveStatus: AutosaveStatus;
  setSectionData: (section: OnboardingDraftSection, data: unknown) => void;
  setStep: (step: number) => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  hydrate: (ownerId: string, draft: Record<string, unknown>, step: number) => void;
  reset: () => void;
}

const EMPTY = { ownerId: null, draft: {}, step: 0, autosaveStatus: "idle" as AutosaveStatus };

/**
 * The wizard's working copy of the onboarding draft, for the time the tab is
 * open. The server (UserProfile.onboardingDraft) is where the draft lives:
 * every step autosaves there, and the wizard loads it from there each time it
 * opens. See docs/11-onboarding-architecture.md.
 *
 * This used to be kept in localStorage as well, and the saved copy won over
 * the server's. On a shared computer that showed the next person the previous
 * person's phone number, date of birth and startup details, and autosave then
 * wrote them into the new account. Nothing personal is kept in the browser now.
 */
export const useOnboardingStore = create<OnboardingStoreState>()((set) => ({
  ...EMPTY,
  setSectionData: (section, data) => set((state) => ({ draft: { ...state.draft, [section]: data } })),
  setStep: (step) => set({ step }),
  setAutosaveStatus: (autosaveStatus) => set({ autosaveStatus }),
  hydrate: (ownerId, draft, step) => set({ ownerId, draft, step, autosaveStatus: "idle" }),
  reset: () => set({ ...EMPTY }),
}));

// Remove the copy older versions of the site left behind.
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("vittamhub-onboarding-draft");
  } catch {
    // storage is unavailable (private mode, blocked): there is nothing to remove
  }
}

/** Narrows a draft's JSON-typed section back to its step schema's shape — the draft is persisted as `unknown` because it's arbitrary JSON at rest. */
export function draftSection<T>(draft: Record<string, unknown>, section: OnboardingDraftSection): Partial<T> | undefined {
  return draft[section] as Partial<T> | undefined;
}
