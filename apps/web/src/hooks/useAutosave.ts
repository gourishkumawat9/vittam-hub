"use client";

import { useSaveOnboardingDraft } from "@vittamhub/api-client";
import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

/** Debounces a section's form values into the onboarding draft autosave endpoint — every wizard step wires this to its react-hook-form `watch()`. */
export function useAutosave(section: string, step: number, data: unknown) {
  const { mutate, isPending } = useSaveOnboardingDraft();
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRun = useRef(true);
  // Tracks whether there are debounced changes not yet sent, and the latest
  // values to send — so we can flush on unmount instead of losing them.
  const pendingRef = useRef(false);
  const latestDataRef = useRef(data);
  latestDataRef.current = data;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    pendingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      pendingRef.current = false;
      setStatus("saving");
      mutate(
        { section, step, data: latestDataRef.current as Record<string, unknown> },
        {
          onSuccess: () => setStatus("saved"),
          onError: () => setStatus("error"),
        },
      );
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on serialized data, not the object identity
  }, [JSON.stringify(data)]);

  // Always flush this step's values when it unmounts — deliberately NOT
  // conditional on there being a pending debounced change.
  //
  // The save effect above is keyed on JSON.stringify(data) and skips its first
  // run, so a step whose values the user never altered produced no change, set
  // no pending flag, and was therefore never persisted at all. That silently
  // broke publishing for anyone who accepted a step's defaults — most often
  // Team, whose defaults (teamSize 1, NOT_HIRING) are exactly right for a solo
  // founder, so the section stayed absent from the server draft while the
  // wizard showed it complete from local state and publish failed with
  // "Team details is incomplete".
  //
  // Saving unconditionally costs one request per step visit and guarantees
  // every visited step exists in the draft.
  useEffect(() => {
    return () => {
      pendingRef.current = false;
      mutate({ section, step, data: latestDataRef.current as Record<string, unknown> });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only; section/step/mutate are stable for a step instance
  }, []);

  return { status: isPending ? "saving" : status };
}
