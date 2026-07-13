"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO: pipe to Sentry once SENTRY_DSN is configured (see docs/10-deployment-infrastructure.md)
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="max-w-md text-text-secondary">
        Our team has been notified. Try again, or head back to the homepage if the problem persists.
      </p>
      <button
        onClick={reset}
        className="rounded-button bg-brand-primary px-6 py-3 font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
