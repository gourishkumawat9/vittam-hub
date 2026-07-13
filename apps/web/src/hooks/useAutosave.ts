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

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus("saving");
      mutate(
        { section, step, data: data as Record<string, unknown> },
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

  return { status: isPending ? "saving" : status };
}
