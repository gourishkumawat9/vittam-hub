"use client";

import { Button } from "@vittamhub/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { StatusScreen } from "@/components/StatusScreen";

/** Only same-site paths, so `?from=` can't be used to bounce people to another site. */
function safeReturnPath(from: string | null): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

function UnavailableContent() {
  const returnTo = safeReturnPath(useSearchParams().get("from"));
  return (
    <StatusScreen
      title="We'll be right back"
      description="VittamHub's servers aren't answering right now. Nothing you did caused this. Please try again in a minute."
    >
      <Button asChild className="w-full">
        <Link href={returnTo}>Try again</Link>
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </StatusScreen>
  );
}

/** Where flows that leave the site (OAuth sign-in) land when the API is down. */
export default function UnavailablePage() {
  return (
    <Suspense>
      <UnavailableContent />
    </Suspense>
  );
}
