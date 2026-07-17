"use client";

import { useMyFounderActivity } from "@vittamhub/api-client";
import type { FounderActivityEntryType } from "@vittamhub/types";
import { Card, CardHeader, CardTitle, EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Activity, Briefcase, FileText, Flag, Inbox, LineChart, Rss, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ENTRY_ICON: Record<FounderActivityEntryType, LucideIcon> = {
  MILESTONE: Flag,
  STARTUP_UPDATE: Rss,
  JOB_POSTED: Briefcase,
  TRACTION_UPDATED: LineChart,
  CONNECTION_RECEIVED: Inbox,
  DOCUMENT_UPLOADED: FileText,
  VERIFICATION_COMPLETED: ShieldCheck,
};

/** Broader than the curated milestone timeline — a real-time computed feed across milestones, updates, jobs, traction, connect requests, and pitch-deck uploads. Visually distinct (icon-per-row list) from RecentUpdatesCard's curated timeline. */
export function FounderActivityCard() {
  const { data: activity, isLoading } = useMyFounderActivity();

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-brand-primary" /> Activity
        </CardTitle>
      </CardHeader>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : activity && activity.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {activity.slice(0, 8).map((entry) => {
            const Icon = ENTRY_ICON[entry.type];
            return (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
                  <p className="text-text-primary">{entry.title}</p>
                </div>
                <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(entry.occurredAt)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Activity} title="No activity yet" description="Post an update, add a milestone, or post a job to get started." className="py-8" />
      )}
    </Card>
  );
}
