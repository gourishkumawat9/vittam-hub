"use client";

import { ProgressBar } from "@vittamhub/ui";
import { useEffect, useState } from "react";

/** How long the API usually takes to wake from sleep on its free host. */
const EXPECTED_WAKE_SECONDS = 60;

/**
 * A progress bar that eases toward (never reaches) 100% over about a minute.
 * There's no real progress signal from a waking server, so this only sets
 * expectations; the screen closes as soon as the API answers.
 */
export function WakingProgress() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1_000);
    return () => clearInterval(timer);
  }, []);

  const value = 95 * (1 - Math.exp(-seconds / (EXPECTED_WAKE_SECONDS / 2.5)));
  return (
    <div className="flex w-full flex-col gap-2" aria-live="polite">
      <ProgressBar value={value} />
      <p className="text-xs text-text-secondary">
        {seconds < EXPECTED_WAKE_SECONDS
          ? "This usually takes under a minute."
          : "Taking longer than usual. Hang tight, or try again shortly."}
      </p>
    </div>
  );
}
