"use client";

import { Button } from "@vittamhub/ui";
import Link from "next/link";
import { useEffect } from "react";

import { StatusScreen } from "@/components/StatusScreen";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO: pipe to Sentry once SENTRY_DSN is configured (see docs/10-deployment-infrastructure.md)
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      title="Something went wrong"
      description="This page hit an unexpected problem. Try again, or head back to the homepage if it keeps happening."
    >
      <Button onClick={reset} className="w-full">
        Try again
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </StatusScreen>
  );
}
