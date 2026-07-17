"use client";

import { useMyStartupProfileViews } from "@vittamhub/api-client";
import { Card, CardHeader, CardTitle, EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Eye } from "lucide-react";

export function RecentProfileViewsCard() {
  const { data: views, isLoading } = useMyStartupProfileViews();

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-brand-primary" /> Recent Investor Views
        </CardTitle>
      </CardHeader>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : views && views.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {views.map((view) => (
            <li key={view.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">{view.investor.investorProfile?.firmName ?? view.investor.fullName}</p>
                {view.viewCount > 1 && <p className="text-xs text-text-secondary">Viewed {view.viewCount} times that day</p>}
              </div>
              <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(view.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Eye} title="No views yet" description="Investor profile views will show up here." className="py-8" />
      )}
    </Card>
  );
}
