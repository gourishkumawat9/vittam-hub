"use client";

import { useInvestorAnalytics, type AnalyticsBucket } from "@vittamhub/api-client";
import { PipelineStage } from "@vittamhub/types";
import { Button, Card, ErrorState, Skeleton } from "@vittamhub/ui";
import { Ban, Bookmark, Briefcase, ChevronRight, Kanban, MessageSquareReply, PieChart } from "@vittamhub/ui/icons";
import { formatCompactMoney } from "@vittamhub/utils";
import Link from "next/link";

import { PageHeader, PanelLink, PanelTitle } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";

const PIPELINE_STAGE_LABEL: Record<string, string> = {
  SOURCED: "Sourced",
  SCREENING: "Screening",
  DUE_DILIGENCE: "Due diligence",
  INVESTMENT_COMMITTEE: "Investment committee",
  TERM_SHEET: "Term sheet",
  CLOSED: "Closed",
  PASSED: "Passed",
};
const PIPELINE_ORDER: string[] = Object.values(PipelineStage);

const PASS_REASON_LABEL: Record<string, string> = {
  TOO_EARLY: "Too early",
  NO_TRACTION: "Not enough traction",
  OUTSIDE_THESIS: "Outside my thesis",
  WEAK_TEAM: "Team",
  VALUATION_TOO_HIGH: "Valuation too high",
  COMPETITIVE_CONFLICT: "Conflicts with a portfolio company",
  REGULATORY_RISK: "Regulatory risk",
  NO_PMF: "No product-market fit yet",
  TIMING: "Timing",
  OTHER: "Other",
};

/** The API sends rates as fractions (0.4), not percentages. */
const percent = (fraction: number | null | undefined) => (fraction == null ? null : `${Math.round(fraction * 100)}%`);

function replyTime(hours: number | null) {
  if (hours == null) return null;
  if (hours < 1) return "Under an hour";
  if (hours < 48) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

/** Horizontal bars for a count per label, biggest first (or in a fixed order when one is given). */
function Bars({ buckets, label, order, empty }: { buckets: AnalyticsBucket[]; label: (raw: string) => string; order?: string[]; empty: string }) {
  if (buckets.length === 0) return <p className="caption-5 py-2">{empty}</p>;
  const sorted = order
    ? [...buckets].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
    : [...buckets].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const max = Math.max(1, ...sorted.map((b) => b.count));
  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map((bucket) => (
        <li key={bucket.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate text-text-secondary">{label(bucket.label)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-background-secondary">
            <span className="block h-full rounded-full bg-brand-primary" style={{ width: `${(bucket.count / max) * 100}%` }} />
          </span>
          <span className="text-right font-numeric font-semibold text-text-primary">{bucket.count}</span>
        </li>
      ))}
    </ul>
  );
}

function BarsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="caption-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

/** Two figures side by side inside a panel, each with a label under it. */
function Figure({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-numeric text-xl font-semibold text-text-primary">{value}</span>
      <span className="caption-5">{label}</span>
    </div>
  );
}

const industry = (raw: string) => INDUSTRY_LABEL[raw] ?? raw;
const stage = (raw: string) => STAGE_LABEL[raw] ?? raw;

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useInvestorAnalytics();

  const header = (
    <PageHeader
      title="Analytics"
      description="How your deal flow moves, from connect requests to investments. Every number comes from your own requests, pipeline and portfolio."
      actions={
        <Button size="sm" variant="secondary" asChild>
          <Link href="/investor/pipeline">
            <Kanban className="h-4 w-4" aria-hidden="true" /> Open pipeline
          </Link>
        </Button>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState />
      </div>
    );
  }

  const active = data.totalPipelineEntries - data.dealsClosed - data.passReasons.total;
  const flow = [
    { label: "Connect requests", value: data.connectionsReceived, href: "/investor/requests" },
    { label: "Accepted", value: data.meetingConversion.acceptedConnections, href: "/investor/messages" },
    { label: "Meetings", value: data.meetingConversion.meetings, href: "/investor/meetings" },
    { label: "In your pipeline", value: data.totalPipelineEntries, href: "/investor/pipeline" },
    { label: "Invested", value: data.totalInvestments, href: "/investor/portfolio" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {header}

      <StatStrip
        stats={[
          { label: "In pipeline", value: data.totalPipelineEntries, hint: `${Math.max(0, active)} still open`, href: "/investor/pipeline" },
          { label: "Deals closed", value: data.dealsClosed, hint: percent(data.pipelineConversion) ? `${percent(data.pipelineConversion)} of your pipeline` : "None yet" },
          {
            label: "Investments",
            value: data.totalInvestments,
            hint: `${data.portfolioHealth.activeInvestments} active · ${data.portfolioHealth.exitedInvestments} exited`,
            href: "/investor/portfolio",
          },
          { label: "Average cheque", value: data.averageDealSize != null ? formatCompactMoney(data.averageDealSize, "INR") : "—", hint: "Across recorded investments" },
        ]}
      />

      <Card className="flex flex-col gap-4">
        <PanelTitle icon={Briefcase} title="Your deal flow" />
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {flow.map((step, index) => (
            <li key={step.label} className="relative">
              <Link
                href={step.href}
                className="flex h-full flex-col gap-1 rounded-button border border-border bg-background-secondary/60 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50 dark:hover:bg-white/5"
              >
                <span className="font-numeric text-2xl font-semibold text-text-primary">{step.value}</span>
                <span className="caption-5">{step.label}</span>
              </Link>
              {index < flow.length - 1 && (
                <ChevronRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-text-secondary lg:block" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <p className="caption-5">Startups can also reach your pipeline from Discover, so the steps don&apos;t have to add up.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-4">
          <PanelTitle icon={MessageSquareReply} title="How you reply" />
          <div className="grid grid-cols-2 gap-4">
            <Figure value={percent(data.responseRate) ?? "—"} label="Requests answered" />
            <Figure value={replyTime(data.avgResponseTimeHours) ?? "—"} label="Average time to answer" />
          </div>
          <p className="caption-5 mt-auto">Founders see your reply rate on your profile.</p>
        </Card>
        <Card className="flex flex-col gap-4">
          <PanelTitle icon={Bookmark} title="Watchlist" />
          <div className="grid grid-cols-2 gap-4">
            <Figure value={data.watchlistConversion.watchlistSize} label="Startups saved" />
            <Figure
              value={
                <>
                  {data.watchlistConversion.investedFromWatchlist}
                  {data.watchlistConversion.investedFromWatchlist > 0 && percent(data.watchlistConversion.rate) && <span className="ml-1.5 text-sm font-medium text-text-secondary">{percent(data.watchlistConversion.rate)}</span>}
                </>
              }
              label="Went on to invest"
            />
          </div>
          <PanelLink href="/investor/watchlist">Open watchlist</PanelLink>
        </Card>
        <Card className="flex flex-col gap-4">
          <PanelTitle icon={PieChart} title="Portfolio" />
          <div className="grid grid-cols-2 gap-4">
            <Figure
              value={data.portfolioHealth.averageGrowthRatePercent != null ? `${Math.round(data.portfolioHealth.averageGrowthRatePercent)}%` : "—"}
              label="Average reported growth"
            />
            <Figure value={data.portfolioHealth.averageTrustScore != null ? Math.round(data.portfolioHealth.averageTrustScore) : "—"} label="Average trust score" />
          </div>
          <PanelLink href="/investor/portfolio">Open portfolio</PanelLink>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <PanelTitle icon={PieChart} title="Where you've invested" />
          <BarsPanel title="Industry">
            <Bars buckets={data.investmentDistribution} label={industry} empty="Record an investment in Portfolio and it shows here." />
          </BarsPanel>
          {data.stage.length > 0 && (
            <BarsPanel title="Stage">
              <Bars buckets={data.stage} label={stage} empty="" />
            </BarsPanel>
          )}
          {data.geography.length > 0 && (
            <BarsPanel title="City">
              <Bars buckets={data.geography} label={(raw) => raw} empty="" />
            </BarsPanel>
          )}
        </Card>
        <Card className="flex flex-col gap-5">
          <PanelTitle icon={Kanban} title="Your pipeline" />
          <BarsPanel title="Stage">
            <Bars buckets={data.pipeline} label={(raw) => PIPELINE_STAGE_LABEL[raw] ?? raw} order={PIPELINE_ORDER} empty="Add startups to your pipeline from Discover." />
          </BarsPanel>
          {data.pipelineByIndustry.length > 0 && (
            <BarsPanel title="Industry">
              <Bars buckets={data.pipelineByIndustry} label={industry} empty="" />
            </BarsPanel>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-5">
        <PanelTitle
          icon={Ban}
          title="Why you passed"
          right={
            data.passReasons.total > 0 && (
              <span className="caption-5">
                {data.passReasons.total} passed
                {data.passReasons.averageEvaluationDays != null && ` · ${Math.round(data.passReasons.averageEvaluationDays)} days to decide on average`}
              </span>
            )
          }
        />
        {data.passReasons.total > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <BarsPanel title="Reason">
              <Bars buckets={data.passReasons.byReason} label={(raw) => PASS_REASON_LABEL[raw] ?? raw} empty="" />
            </BarsPanel>
            <BarsPanel title="Industry">
              <Bars buckets={data.passReasons.byIndustry} label={industry} empty="" />
            </BarsPanel>
          </div>
        ) : (
          <p className="caption-5">When you move a startup to Passed in your pipeline, the reasons add up here, so you can see your own patterns.</p>
        )}
      </Card>
    </div>
  );
}
