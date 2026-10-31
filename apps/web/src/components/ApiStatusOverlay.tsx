"use client";

import { getApiStatus, subscribeApiStatus, type ApiStatus } from "@vittamhub/api-client";
import { Button } from "@vittamhub/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusScreen } from "@/components/StatusScreen";
import { WakingProgress } from "@/components/WakingProgress";
import { CinematicLoader } from "@/components/loader/CinematicLoader";
import { cn } from "@/lib/utils";

/** Pages that render fully without the API, so a slow API is no reason to cover them. */
const STATIC_PATHS = new Set(["/", "/about", "/pricing", "/privacy", "/terms", "/unavailable"]);

/**
 * Covers the page while the API is waking up (the free host sleeps after 15
 * idle minutes and needs about a minute to start) or can't be reached, so
 * people see what's happening instead of empty skeletons or a dead button.
 * Fades out on its own as soon as a request gets through.
 */
export function ApiStatusOverlay() {
  const pathname = usePathname();
  const [status, setStatus] = useState<ApiStatus>(getApiStatus);
  // The screen last shown, kept on while it fades out.
  const [shown, setShown] = useState<ApiStatus | null>(null);
  const covering = status !== "ok" && !STATIC_PATHS.has(pathname);

  useEffect(() => subscribeApiStatus(setStatus), []);
  useEffect(() => {
    if (covering) setShown(status);
  }, [covering, status]);

  const screen = covering ? status : shown;
  if (!screen || screen === "ok") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-modal transition-opacity duration-300",
        !covering && "pointer-events-none opacity-0",
      )}
      onTransitionEnd={(event) => {
        if (!covering && event.target === event.currentTarget) setShown(null);
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="api-status-title"
    >
      {screen === "slow" ? (
        <StatusScreen
          title="Waking up VittamHub"
          description="Our servers rest when things are quiet. We're starting them up for you now."
          illustration={<CinematicLoader framing="landscape" />}
        >
          <WakingProgress />
        </StatusScreen>
      ) : (
        <StatusScreen
          title="We'll be right back"
          description="VittamHub can't be reached right now. Check your connection, or try again in a minute."
        >
          <Button onClick={() => window.location.reload()} className="w-full">
            Try again
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
        </StatusScreen>
      )}
    </div>
  );
}
