"use client";

import { useMyStartupAnalytics } from "@vittamhub/api-client";
import { Card, EmptyState } from "@vittamhub/ui";
import { BarChart3 } from "lucide-react";

function WeeklyViewsChart({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">Weekly profile views</h2>
      {buckets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0 truncate text-text-secondary">{bucket.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-secondary">
                <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(bucket.count / max) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right font-numeric text-text-primary">{bucket.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-secondary">No investor views yet.</p>
      )}
    </Card>
  );
}

export default function FounderAnalyticsPage() {
  const { data, isLoading } = useMyStartupAnalytics();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Complete your startup profile to start tracking views, connections, and growth."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-text-secondary">Investor views</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.totalInvestorViews}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Connection requests</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.connectionRequestsReceived}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Followers</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.followerCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Profile completion</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.profileCompletionPercent}%</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WeeklyViewsChart buckets={data.weeklyProfileViews} />
        <Card className="flex flex-col gap-2">
          <h2 className="font-heading text-sm font-semibold text-text-primary">Timeline growth</h2>
          <p className="text-xs text-text-secondary">Milestones added</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.milestoneCount}</p>
        </Card>
      </div>
    </div>
  );
}
