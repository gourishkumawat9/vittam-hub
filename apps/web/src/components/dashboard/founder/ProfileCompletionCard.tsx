"use client";

import type { ProfileCompletion } from "@vittamhub/types";
import { Card, CardHeader, CardTitle, ProgressBar } from "@vittamhub/ui";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

export function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-brand-primary" /> Profile Completion
        </CardTitle>
      </CardHeader>

      <ProgressBar value={completion.percent} />

      {completion.missing.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {completion.missing.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-button px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
              >
                {item.label}
                <span className="text-brand-primary">Fix →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-success-600">Your profile is fully complete.</p>
      )}
    </Card>
  );
}
