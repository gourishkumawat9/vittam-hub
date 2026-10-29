"use client";

import { getApiStatus, subscribeApiStatus, type ApiStatus } from "@vittamhub/api-client";
import { Button } from "@vittamhub/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PillarLoader } from "@/components/PillarLoader";
import { StatusScreen } from "@/components/StatusScreen";
import { WakingProgress } from "@/components/WakingProgress";

/** Pages that render fully without the API, so a slow API is no reason to cover them. */
const STATIC_PATHS = new Set(["/", "/about", "/pricing", "/privacy", "/terms", "/unavailable"]);

/**
 * Covers the page while the API is waking up (the free host sleeps after 15
 * idle minutes and needs about a minute to start) or can't be reached, so
 * people see what's happening instead of empty skeletons or a dead button.
 * Closes on its own as soon as a request gets through.
 */
export function ApiStatusOverlay() {
  const pathname = usePathname();
  const [status, setStatus] = useState<ApiStatus>(getApiStatus);

  useEffect(() => subscribeApiStatus(setStatus), []);

  if (status === "ok" || STATIC_PATHS.has(pathname)) return null;

  return (
    <div className="fixed inset-0 z-modal" role="alertdialog" aria-modal="true" aria-labelledby="api-status-title">
      {status === "slow" ? (
        <StatusScreen
          title="Waking up VittamHub"
          description="Our servers rest when things are quiet. We're starting them up for you now."
          illustration={<PillarLoader />}
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
