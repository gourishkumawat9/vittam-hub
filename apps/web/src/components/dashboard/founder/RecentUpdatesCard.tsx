"use client";

import type { StartupMilestone } from "@vittamhub/types";
import { Card, CardHeader, CardTitle, EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { FileText, History, Link2 } from "lucide-react";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(url);
}

function EvidenceRow({ evidenceUrls }: { evidenceUrls: string[] }) {
  if (evidenceUrls.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {evidenceUrls.map((url) =>
        isImageUrl(url) ? (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, thumbnail only */}
            <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
          </a>
        ) : (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 items-center gap-1 rounded-button border border-border px-2 text-xs text-text-secondary hover:text-brand-primary"
          >
            {url.startsWith("http") && !url.includes("/documents/") ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            Evidence
          </a>
        ),
      )}
    </div>
  );
}

export function RecentUpdatesCard({ milestones }: { milestones: StartupMilestone[] }) {
  const recent = [...milestones].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 5);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-brand-primary" /> Recent Updates
        </CardTitle>
      </CardHeader>

      {recent.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {recent.map((milestone) => (
            <li key={milestone.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">{milestone.title}</p>
                {milestone.description && <p className="text-xs text-text-secondary">{milestone.description}</p>}
                <EvidenceRow evidenceUrls={milestone.evidenceUrls} />
              </div>
              <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(milestone.achievedAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={History} title="No updates yet" description="Add a milestone to start your timeline." className="py-8" />
      )}
    </Card>
  );
}
