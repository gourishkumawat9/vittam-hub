import type { IncubatorProgramRecord } from "@vittamhub/api-client";
import { Badge } from "@vittamhub/ui";
import { AlertCircle, CalendarRange, Clock, ExternalLink } from "lucide-react";

import { externalHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

import { programmeStatus, sortProgrammes, STATUS_BADGE } from "./programmes";

/**
 * Programmes as rows: name and where its application window stands, then
 * length, who can apply, and the link to apply. `viewer` decides the wording:
 * the owner is told what's missing, a founder is shown how to apply.
 */
export function ProgrammeList({ programmes, viewer }: { programmes: IncubatorProgramRecord[]; viewer: "owner" | "founder" }) {
  return (
    <ul className="flex flex-col gap-3">
      {sortProgrammes(programmes).map((programme) => {
        const status = programmeStatus(programme);
        const applyHref = programme.applicationUrl ? externalHref(programme.applicationUrl) : null;
        return (
          <li
            key={programme.id}
            className={cn(
              "flex flex-col gap-3 rounded-button border p-4",
              status.state === "open" ? "border-success-100 bg-success-50/60 dark:border-success-700/40 dark:bg-success-700/10" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="title-3">{programme.name}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 caption-5">
                  {status.hint && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                      {status.hint}
                    </span>
                  )}
                  {programme.durationWeeks != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {programme.durationWeeks} weeks
                    </span>
                  )}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[status.state]}>{status.label}</Badge>
            </div>

            {programme.description && <p className="body-6 text-text-secondary">{programme.description}</p>}

            {programme.eligibilityCriteria && (
              <div className="rounded-button bg-background-secondary px-3 py-2">
                <p className="caption-4">Who can apply</p>
                <p className="body-6 text-text-primary">{programme.eligibilityCriteria}</p>
              </div>
            )}

            {applyHref ? (
              <a
                href={applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
              >
                {viewer === "founder" ? "Apply" : "Application link"} on {new URL(applyHref).hostname}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : viewer === "owner" && status.state === "open" ? (
              <p className="flex items-center gap-1.5 caption-5 text-warning-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Add an application link so founders can apply
              </p>
            ) : viewer === "founder" && status.state === "open" ? (
              <p className="caption-5">No application link yet. Follow them to hear when it&apos;s posted.</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
