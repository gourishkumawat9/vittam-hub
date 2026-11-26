"use client";

import { useConnectionQuota, useMyStartup, useMyStartupAnalytics } from "@vittamhub/api-client";
import { Button, Card, EmptyState, ErrorState, Skeleton } from "@vittamhub/ui";
import { ArrowRight, BarChart3, Flag, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { StatTilesSkeleton } from "@/components/dashboard/StatTilesSkeleton";
import { AddMilestoneDialog } from "@/components/dashboard/founder/AddMilestoneDialog";
import { cn, isNotFoundError } from "@/lib/utils";

const WEEKS = 12;

/** Monday 00:00 UTC of the week holding `date`: the same weeks the API groups views into (Postgres `date_trunc('week')`). */
function weekStart(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - sinceMonday);
  return day;
}

/**
 * The last twelve weeks, oldest first, with a zero for every week nobody
 * looked: the API only returns weeks that had views.
 */
function lastTwelveWeeks(buckets: { label: string; count: number }[]) {
  const counts = new Map(buckets.map((bucket) => [bucket.label, bucket.count]));
  const thisWeek = weekStart(new Date());
  return Array.from({ length: WEEKS }, (_, index) => {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - (WEEKS - 1 - index) * 7);
    const key = start.toISOString().slice(0, 10);
    return {
      key,
      label: start.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }),
      count: counts.get(key) ?? 0,
    };
  });
}

/** A round top for the y-axis, so its three lines read as plain numbers (0, 5, 10). */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
}

/**
 * One bar per week, in the brand blue. Hovering or focusing a week shows its
 * count; a table with the same numbers sits underneath for screen readers.
 */
function WeeklyViewsChart({ buckets }: { buckets: { label: string; count: number }[] }) {
  const weeks = useMemo(() => lastTwelveWeeks(buckets), [buckets]);
  const [hovered, setHovered] = useState<number | null>(null);
  const total = weeks.reduce((sum, week) => sum + week.count, 0);
  const top = niceMax(Math.max(...weeks.map((week) => week.count)));
  const ticks = [top, top / 2, 0];

  return (
    <Card className="flex flex-col gap-5">
      <PanelTitle
        icon={BarChart3}
        title="Investor views, last 12 weeks"
        right={<span className="caption-4">{total === 1 ? "1 view" : `${total} views`}</span>}
      />

      <div className="relative">
        {/* Gridlines with their values: quiet, so the bars carry the reading. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-6 top-0">
          {ticks.map((tick) => (
            // Centred on its value, so the line sits exactly where a bar of that height ends.
            <div key={tick} className="absolute inset-x-0 flex translate-y-1/2 items-center gap-2" style={{ bottom: `${(tick / top) * 100}%` }}>
              <span className="w-6 shrink-0 text-right font-numeric text-[11px] text-text-secondary">{tick}</span>
              <span className={cn("h-px flex-1", tick === 0 ? "bg-border" : "bg-border/50")} />
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="relative ml-8 flex h-56 items-end gap-0.5 pb-6 sm:gap-1">
          {weeks.map((week, index) => (
            <div
              key={week.key}
              className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === index && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-button border border-border bg-surface px-2.5 py-1.5 shadow-md">
                  <p className="caption-5">Week of {week.label}</p>
                  <p className="body-5 font-numeric text-text-primary">
                    {week.count} {week.count === 1 ? "view" : "views"}
                  </p>
                </div>
              )}
              <div
                className={cn(
                  "mx-auto w-full max-w-9 rounded-t-[4px] transition-colors duration-150",
                  week.count > 0 ? (hovered === index ? "bg-brand-700" : "bg-brand-primary") : "bg-transparent",
                )}
                style={{ height: `${(week.count / top) * 100}%` }}
              />
              <span
                className={cn(
                  "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-text-secondary",
                  // Every other week on narrow screens, so labels never collide.
                  index % 2 === 1 && "hidden sm:inline",
                  index % 2 === 0 && "inline",
                )}
              >
                {week.label}
              </span>
            </div>
          ))}
        </div>

        {total === 0 && (
          <div className="absolute inset-x-8 top-10 mx-auto max-w-sm rounded-card border border-dashed border-border bg-surface/90 p-4 text-center backdrop-blur-sm">
            <p className="body-5 text-text-primary">No investor views yet</p>
            <p className="caption-5 mt-1">Each week an investor opens your profile shows here. Connect requests are the surest way to get a first look.</p>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>Investor views per week, last 12 weeks</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Views</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.key}>
              <td>{week.label}</td>
              <td>{week.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** What raises the numbers above, each a link to where it's done. */
function NextStepsCard({ completion, onAddMilestone }: { completion: number; onAddMilestone: () => void }) {
  const steps = [
    ...(completion < 100
      ? [{ label: "Fill in the rest of your profile", hint: `It's ${completion}% complete`, href: "/onboarding/founder" }]
      : []),
    { label: "Send a connect request", hint: "Each request takes an investor straight to your profile", href: "/founder/investors" },
    { label: "Upload your pitch deck", hint: "Private until you share it with an investor", href: "/founder/documents" },
    { label: "Post an update to the community", hint: "Followers see it in their feed", href: "/community" },
  ];
  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Lightbulb} title="Get more views" />
      <ul className="flex flex-col divide-y divide-border">
        {steps.map((step) => (
          <li key={step.label} className="py-3 first:pt-0">
            <Link href={step.href} className="group flex items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="body-5 text-text-primary group-hover:text-brand-primary">{step.label}</span>
                <span className="caption-5">{step.hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={onAddMilestone} className="group flex w-full items-center justify-between gap-3 pt-3 text-left">
            <span className="flex flex-col gap-0.5">
              <span className="body-5 text-text-primary group-hover:text-brand-primary">Add a milestone</span>
              <span className="caption-5">A dated record of progress on your public profile</span>
            </span>
            <Flag className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </Card>
  );
}

/**
 * How investors and founders are finding the startup. Every number is the
 * founder's own activity; nothing is estimated or filled in.
 */
export default function FounderAnalyticsPage() {
  const { data, isLoading, isError, error } = useMyStartupAnalytics();
  const { data: startup } = useMyStartup();
  const { data: quota } = useConnectionQuota();
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Analytics" />
        <StatTilesSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full lg:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }
  // A founder who hasn't published a startup yet has none, so the API
  // answers 404: that's the empty state, not a failure.
  if (isError && !isNotFoundError(error)) return <ErrorState />;
  if (!data) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Analytics" />
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Publish your startup profile to start seeing investor views, connect requests and followers."
          action={
            <Button asChild size="sm">
              <Link href="/onboarding/founder">Set up your startup profile</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const quotaHint = quota && (quota.limit === null ? "Unlimited this month" : `${quota.remaining} of ${quota.limit} left this month`);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analytics"
        description={`How investors and founders are finding ${startup?.name ?? "your startup"}. Every number is your own activity.`}
        actions={
          startup && (
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/startups/${startup.slug}`}>View public page</Link>
            </Button>
          )
        }
      />

      <StatStrip
        stats={[
          { label: "Investor views", value: data.totalInvestorViews, hint: "Since your profile went live" },
          { label: "Connect requests sent", value: data.connectionRequestsReceived, hint: quotaHint ?? undefined, href: "/founder/investors" },
          { label: "Followers", value: data.followerCount, hint: "People following your updates" },
          { label: "Milestones", value: data.milestoneCount, hint: "On your public timeline" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyViewsChart buckets={data.weeklyProfileViews} />
        </div>
        <NextStepsCard completion={data.profileCompletionPercent} onAddMilestone={() => setMilestoneOpen(true)} />
      </div>

      <AddMilestoneDialog open={milestoneOpen} onOpenChange={setMilestoneOpen} />
    </div>
  );
}
