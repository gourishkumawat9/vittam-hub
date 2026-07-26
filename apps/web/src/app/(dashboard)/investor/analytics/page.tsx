"use client";

import { useInvestorAnalytics } from "@vittamhub/api-client";
import type { AnalyticsBucket } from "@vittamhub/api-client";
import { Card, CardHeader, CardTitle, EmptyState, ErrorState } from "@vittamhub/ui";
import { formatCompactMoney } from "@vittamhub/utils";
import { BarChart3, Ban, Bookmark, Gauge } from "lucide-react";

import { StatTilesSkeleton } from "@/components/dashboard/StatTilesSkeleton";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function BucketBars({ title, buckets }: { title: string; buckets: AnalyticsBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">{title}</h2>
      {buckets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 truncate text-text-secondary">{titleCase(bucket.label)}</span>
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
  const { data, isLoading, isError } = useInvestorAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Analytics</h1>
        <StatTilesSkeleton count={6} />
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!data) return <EmptyState icon={BarChart3} title="No analytics yet" description="Start building your pipeline and portfolio to see charts here." />;

  const conversionRate =
    data.meetingConversion.meetings > 0 ? Math.round((data.meetingConversion.acceptedConnections / data.meetingConversion.meetings) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
        <Card>
          <p className="text-xs text-text-secondary">Deals closed</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.dealsClosed}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Avg deal size</p>
          <p className="font-numeric text-xl font-bold text-text-primary">
            {data.averageDealSize != null ? formatCompactMoney(data.averageDealSize, "INR") : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Pipeline → close rate</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data.pipelineConversion != null ? `${Math.round(data.pipelineConversion)}%` : "—"}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <Gauge className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Responsiveness</CardTitle>
          </CardHeader>
          <p className="text-xs text-text-secondary">Response rate</p>
          <p className="font-numeric text-xl font-bold text-text-primary">{data.responseRate != null ? `${Math.round(data.responseRate)}%` : "—"}</p>
          <p className="mt-1 text-xs text-text-secondary">Avg response time</p>
          <p className="font-numeric text-xl font-bold text-text-primary">
            {data.avgResponseTimeHours != null ? `${Math.round(data.avgResponseTimeHours)}h` : "—"}
          </p>
        </Card>

        <Card className="flex flex-col gap-1">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <Bookmark className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Watchlist conversion</CardTitle>
          </CardHeader>
          <p className="text-xs text-text-secondary">Watchlist size</p>
          <p className="font-numeric text-xl font-bold text-text-primary">{data.watchlistConversion.watchlistSize}</p>
          <p className="mt-1 text-xs text-text-secondary">Invested from watchlist</p>
          <p className="font-numeric text-xl font-bold text-text-primary">
            {data.watchlistConversion.investedFromWatchlist}
            {data.watchlistConversion.rate != null && (
              <span className="ml-1 text-sm font-medium text-text-secondary">({Math.round(data.watchlistConversion.rate)}%)</span>
            )}
          </p>
        </Card>

        <Card className="flex flex-col gap-1">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <BarChart3 className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Portfolio health</CardTitle>
          </CardHeader>
          <p className="text-xs text-text-secondary">Avg trust score</p>
          <p className="font-numeric text-xl font-bold text-text-primary">{data.portfolioHealth.averageTrustScore ?? "—"}</p>
          <p className="mt-1 text-xs text-text-secondary">Avg growth rate</p>
          <p className="font-numeric text-xl font-bold text-text-primary">
            {data.portfolioHealth.averageGrowthRatePercent != null ? `${data.portfolioHealth.averageGrowthRatePercent}%` : "—"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BucketBars title="Investment distribution by industry" buckets={data.investmentDistribution} />
        <BucketBars title="Geography" buckets={data.geography} />
        <BucketBars title="Stage" buckets={data.stage} />
        <BucketBars title="Pipeline by stage" buckets={data.pipeline} />
        <BucketBars title="Pipeline by industry" buckets={data.pipelineByIndustry} />
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <Ban className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-base">Pass reasons</CardTitle>
        </CardHeader>
        <p className="text-xs text-text-secondary">
          {data.passReasons.total} passed
          {data.passReasons.averageEvaluationDays != null && ` · avg ${Math.round(data.passReasons.averageEvaluationDays)} days to decide`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <BucketBars title="By reason" buckets={data.passReasons.byReason} />
          <BucketBars title="By industry" buckets={data.passReasons.byIndustry} />
        </div>
      </Card>
    </div>
  );
}
