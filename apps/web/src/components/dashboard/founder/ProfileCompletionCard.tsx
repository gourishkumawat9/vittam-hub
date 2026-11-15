"use client";

import type { ProfileCompletion } from "@vittamhub/types";
import { Card, CardHeader, CardTitle, ProgressBar } from "@vittamhub/ui";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";

const ROW = "flex w-full items-center justify-between gap-3 rounded-button px-2 py-1.5 text-left text-xs text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary";

/**
 * What the profile is still missing. Each row goes to the place that item is
 * added (the API sends the address); the milestone opens the dashboard's own
 * dialog, and a row that needs nothing done is plain text.
 */
export function ProfileCompletionCard({ completion, onAddMilestone }: { completion: ProfileCompletion; onAddMilestone: () => void }) {
  return (
    <Card id="profile-completion" className="flex scroll-mt-20 flex-col gap-4">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-brand-primary" /> Profile Completion
        </CardTitle>
        <span className="font-numeric text-sm font-semibold text-text-primary">{completion.percent}%</span>
      </CardHeader>

      <ProgressBar value={completion.percent} />

      {completion.missing.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {completion.missing.map((item) => {
            const arrow = <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />;
            if (item.key === "recentMilestone") {
              return (
                <li key={item.key}>
                  <button type="button" onClick={onAddMilestone} className={ROW}>
                    {item.label}
                    {arrow}
                  </button>
                </li>
              );
            }
            // "/founder" is this page: nothing to open, the line is information.
            if (item.href === "/founder") {
              return (
                <li key={item.key} className="px-2 py-1.5 text-xs text-text-secondary">
                  {item.label}
                </li>
              );
            }
            return (
              <li key={item.key}>
                <Link href={item.href} className={ROW}>
                  {item.label}
                  {arrow}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-success-600">Your profile is fully complete.</p>
      )}
    </Card>
  );
}
