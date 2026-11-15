"use client";

import { useSaveOnboardingDraft } from "@vittamhub/api-client";
import type { OnboardingDraftSection } from "@vittamhub/types";
import { useEffect, useRef, useState } from "react";

import { useOnboardingStore, type AutosaveStatus } from "@/store/onboarding-store";

export type { AutosaveStatus };

const DEBOUNCE_MS = 800;

/**
 * Debounces a section's form values into the onboarding draft autosave
 * endpoint — every wizard step wires this to its react-hook-form `watch()`.
 *
 * What is sent to the server is also written to the wizard's own copy of the
 * draft. A step used to update that copy only when "Continue" was pressed, so
 * going Back kept the old values there; returning to the step showed them,
 * and the step's save-on-leave then wrote the old values over the new ones.
 */
export function useAutosave(section: OnboardingDraftSection, step: number, data: unknown) {
  const { mutate, isPending } = useSaveOnboardingDraft();
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const setSharedStatus = useOnboardingStore((s) => s.setAutosaveStatus);
  const [status, setLocalStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRun = useRef(true);
  const latestDataRef = useRef(data);
  latestDataRef.current = data;

  // The header's "Saving… / Saved" indicator reads the shared status.
  const setStatus = (next: AutosaveStatus) => {
    setLocalStatus(next);
    setSharedStatus(next);
  };

  const save = () => {
    if (!useOnboardingStore.getState().ownerId) return; // published and cleared: there is no draft to save into
    const values = latestDataRef.current as Record<string, unknown>;
    setSectionData(section, values);
    setStatus("saving");
    mutate(
      { section, step, data: values },
      // Its own error handler, so a failed autosave shows in the indicator
      // instead of raising an error toast for every keystroke's retry.
      { onSuccess: () => setStatus("saved"), onError: () => setStatus("error") },
    );
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on serialized data, not the object identity
  }, [JSON.stringify(data)]);

  // Always flush this step's values when it unmounts — deliberately NOT
  // conditional on there being a pending debounced change.
  //
  // The save effect above is keyed on JSON.stringify(data) and skips its first
  // run, so a step whose values the user never altered produced no change and
  // was therefore never persisted at all. That silently broke publishing for
  // anyone who accepted a step's defaults — most often Team, whose defaults
  // (teamSize 1, NOT_HIRING) are exactly right for a solo founder.
  //
  // Saving unconditionally costs one request per step visit and guarantees
  // every visited step exists in the draft.
  useEffect(() => {
    return () => {
      // Leaving because the profile was just published: the draft is gone,
      // and saving this step again would start a new one behind the live profile.
      if (!useOnboardingStore.getState().ownerId) return;
      const values = latestDataRef.current as Record<string, unknown>;
      setSectionData(section, values);
      mutate({ section, step, data: values }, { onError: () => setSharedStatus("error") });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only; section/step/mutate are stable for a step instance
  }, []);

  return { status: isPending ? "saving" : status };
}
