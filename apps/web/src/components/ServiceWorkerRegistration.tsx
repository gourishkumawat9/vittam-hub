"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which shows public/offline.html when the site
 * can't be reached at all. Production only: in development it would keep
 * serving the offline page whenever the dev server restarts.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort: without it, people just see the browser's own offline page.
    });
  }, []);

  return null;
}
