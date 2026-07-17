"use client";

import { useInvestorAnalytics } from "@vittamhub/api-client";
import type { AnalyticsBucket } from "@vittamhub/api-client";
import { Card, EmptyState } from "@vittamhub/ui";
import { BarChart3 } from "lucide-react";

function BucketBars({ title, buckets }: { title: string; buckets: AnalyticsBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">{title}</h2>
      {buckets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 truncate text-text-secondary">{bucket.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-secondary">
                <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(bucket.count / max) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right font-numeric text-text-primary">{bucket.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-secondary">No data yet.</p>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useInvestorAnalytics();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!data) return <EmptyState icon={BarChart3} title="No analytics yet" description="Start building your pipeline and portfolio to see charts here." />;

  const conversionRate =
    data.meetingConversion.meetings > 0 ? Math.round((data.meetingConversion.acceptedConnections / data.meetingConversion.meetings) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-text-secondary">Total investments</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.totalInvestments}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Pipeline entries</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.totalPipelineEntries}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Meeting → accept rate</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{conversionRate}%</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BucketBars title="Investment distribution by industry" buckets={data.investmentDistribution} />
        <BucketBars title="Geography" buckets={data.geography} />
        <BucketBars title="Stage" buckets={data.stage} />
        <BucketBars title="Pipeline by stage" buckets={data.pipeline} />
      </div>
    </div>
  );
}
