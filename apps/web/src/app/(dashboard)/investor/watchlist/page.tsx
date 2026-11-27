"use client";

import {
  useCreateWatchlistTrigger,
  useFollowStartup,
  useRemoveWatchlistTrigger,
  useUnfollowStartup,
  useUpdateWatchlistEntry,
  useWatchlist,
  useWatchlistTriggers,
  type StartupFollowWithStartup,
} from "@vittamhub/api-client";
import { WatchlistTriggerType, type CreateWatchlistTriggerInput } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Input, Select } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Bell, BellOff, BellRing, Bookmark, Compass, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";
import { cn } from "@/lib/utils";

const UNGROUPED_LABEL = "Not in a list";

/** Each alert as the sentence an investor would say: "tell me when it…". */
const TRIGGER_LABEL: Record<string, string> = {
  REVENUE_ABOVE: "Monthly revenue passes an amount",
  TRUST_BAND_REACHES: "Trust band reaches a level",
  GST_VERIFIED: "GST registration is confirmed",
  MCA_VERIFIED: "Company registration is confirmed",
  FUNDING_ROUND_OPENED: "Starts raising",
  HEADCOUNT_DOUBLED: "Team size doubles",
  NEW_FOUNDER_ADDED: "Adds a co-founder",
  VERIFICATION_COMPLETED: "Gets the Verified badge",
  NEW_METRICS_UPLOADED: "Shares new numbers",
  NEW_CAP_TABLE_INVESTOR: "Adds an investor to its cap table",
  PRODUCT_LAUNCHED: "Launches its product",
  PATENT_GRANTED: "Is granted a patent",
  MILESTONE_POSTED: "Posts a milestone",
};

// Registry checks (GST, MCA) aren't automated yet, so an alert on them could never fire: not offered (CLAUDE.md §8).
const NOT_YET_AUTOMATED = new Set<string>(["GST_VERIFIED", "MCA_VERIFIED"]);
const TRIGGER_TYPE_OPTIONS = Object.values(WatchlistTriggerType)
  .filter((value) => !NOT_YET_AUTOMATED.has(value))
  .map((value) => ({ label: TRIGGER_LABEL[value] ?? value, value }));
const TRUST_BAND_OPTIONS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((value) => ({ label: value.charAt(0) + value.slice(1).toLowerCase(), value }));
const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** An existing alert as a sentence: "When its trust band reaches Gold". */
function describeTrigger(trigger: { type: string; thresholdAmount: number | null; thresholdBand: string | null }) {
  if (trigger.type === "REVENUE_ABOVE" && trigger.thresholdAmount != null) {
    return `When its monthly revenue passes ₹${Number(trigger.thresholdAmount).toLocaleString("en-IN")}`;
  }
  if (trigger.type === "TRUST_BAND_REACHES" && trigger.thresholdBand) return `When its trust band reaches ${titleCase(trigger.thresholdBand)}`;
  const label = TRIGGER_LABEL[trigger.type] ?? trigger.type;
  return `When it ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

const AMOUNT_TRIGGER_TYPES = new Set<string>(["REVENUE_ABOVE"]);
const BAND_TRIGGER_TYPES = new Set<string>(["TRUST_BAND_REACHES"]);

type Tab = "saved" | "watching" | "alerts";

function AlertsTab({ follows }: { follows: StartupFollowWithStartup[] }) {
  const { data: triggers, isLoading, isError } = useWatchlistTriggers();
  const createTrigger = useCreateWatchlistTrigger();
  const removeTrigger = useRemoveWatchlistTrigger();
  const [startupId, setStartupId] = useState("");
  const [type, setType] = useState<CreateWatchlistTriggerInput["type"]>(WatchlistTriggerType.FUNDING_ROUND_OPENED);
  const [thresholdAmount, setThresholdAmount] = useState("");
  const [thresholdBand, setThresholdBand] = useState("GOLD");

  const startupOptions = follows.map((f) => ({ label: f.startup.name, value: f.startup.id }));

  const handleCreate = () => {
    if (!startupId) return;
    createTrigger.mutate({
      startupId,
      type,
      thresholdAmount: AMOUNT_TRIGGER_TYPES.has(type) ? Number(thresholdAmount) : undefined,
      thresholdBand: BAND_TRIGGER_TYPES.has(type) ? (thresholdBand as CreateWatchlistTriggerInput["thresholdBand"]) : undefined,
    });
    setStartupId("");
    setThresholdAmount("");
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <Card className="flex flex-col gap-4 lg:sticky lg:top-24">
        <PanelTitle icon={BellRing} title="New alert" />
        <p className="caption-5">Checked every hour. You get one notification the first time it comes true.</p>
        {startupOptions.length === 0 ? (
          <p className="caption-2">Save a startup first, then set an alert on it.</p>
        ) : (
          <>
            <Select label="Startup" placeholder="Choose a saved startup…" options={startupOptions} value={startupId} onChange={setStartupId} />
            <Select label="Tell me when it…" options={TRIGGER_TYPE_OPTIONS} value={type} onChange={(v) => setType(v as CreateWatchlistTriggerInput["type"])} />
            {AMOUNT_TRIGGER_TYPES.has(type) && (
              <Input label="Amount (₹)" type="number" min={0} value={thresholdAmount} onChange={(e) => setThresholdAmount(e.target.value)} />
            )}
            {BAND_TRIGGER_TYPES.has(type) && <Select label="Level" options={TRUST_BAND_OPTIONS} value={thresholdBand} onChange={setThresholdBand} />}
            <Button onClick={handleCreate} isLoading={createTrigger.isPending} disabled={!startupId}>
              Create alert
            </Button>
          </>
        )}
      </Card>

      <div className="lg:col-span-2">
        {isLoading ? (
          <ListRowsSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : triggers && triggers.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <ul className="flex flex-col divide-y divide-border">
              {triggers.map((trigger) => (
                <li key={trigger.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Avatar name={trigger.startup.name} src={trigger.startup.logoUrl} size="md" className="rounded-button" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/startups/${trigger.startup.slug}`} className="body-5 truncate text-text-primary hover:text-brand-primary">
                      {trigger.startup.name}
                    </Link>
                    <p className="caption-5">{describeTrigger(trigger)}</p>
                  </div>
                  {trigger.firedAt ? (
                    <Badge variant="success">Came true {formatRelativeTime(trigger.firedAt)}</Badge>
                  ) : NOT_YET_AUTOMATED.has(trigger.type) ? (
                    <Badge variant="neutral">Not checked yet</Badge>
                  ) : (
                    <Badge variant="brand">Watching</Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTrigger.mutate(trigger.id)}
                    className="rounded-button p-1.5 text-text-secondary transition-colors hover:bg-background-secondary hover:text-danger-600"
                    aria-label={`Delete the alert on ${trigger.startup.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState icon={Bell} title="No alerts yet" description="Set one on a saved startup and you'll hear when it starts raising, posts a milestone, and more." />
        )}
      </div>
    </div>
  );
}

/** A saved startup with its list, the investor's private notes, and whether its updates notify them. */
function WatchlistCard({ follow }: { follow: StartupFollowWithStartup }) {
  const unfollow = useUnfollowStartup();
  const follow_ = useFollowStartup();
  const updateEntry = useUpdateWatchlistEntry();
  const [notes, setNotes] = useState(follow.notes ?? "");
  const [listName, setListName] = useState(follow.listName ?? "");
  const { startup } = follow;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar name={startup.name} src={startup.logoUrl} size="md" className="rounded-button" />
        <div className="min-w-0 flex-1">
          <Link href={`/startups/${startup.slug}`} className="title-3 block truncate hover:text-brand-primary">
            {startup.name}
          </Link>
          <p className="caption-5 line-clamp-2">{startup.tagline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
        <Badge variant="neutral">{INDUSTRY_LABEL[startup.industry] ?? startup.industry}</Badge>
        {startup.isFundraising && <Badge variant="success">Raising</Badge>}
        {follow.notifyOnUpdate && <Badge variant="info">Watching</Badge>}
      </div>

      <div className="flex flex-col gap-2 rounded-button bg-background-secondary p-3">
        <label className="flex flex-col gap-1">
          <span className="caption-4">List</span>
          <input
            value={listName}
            placeholder="e.g. Seed pipeline"
            onChange={(e) => setListName(e.target.value)}
            onBlur={() => {
              if (listName !== (follow.listName ?? "")) updateEntry.mutate({ startupId: startup.id, input: { listName } });
            }}
            className="rounded-button border border-transparent bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="caption-4">Private notes</span>
          <textarea
            value={notes}
            rows={2}
            placeholder="Only you see these"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (follow.notes ?? "")) updateEntry.mutate({ startupId: startup.id, input: { notes } });
            }}
            className="resize-none rounded-button border border-transparent bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="caption-5">Saved {formatRelativeTime(follow.createdAt)}</span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => follow_.mutate({ startupId: startup.id, notifyOnUpdate: !follow.notifyOnUpdate })}
            isLoading={follow_.isPending}
            aria-label={follow.notifyOnUpdate ? `Stop watching ${startup.name}` : `Watch ${startup.name} for updates`}
          >
            {follow.notifyOnUpdate ? <BellOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {follow.notifyOnUpdate ? "Stop watching" : "Watch"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => unfollow.mutate(startup.id)} isLoading={unfollow.isPending} aria-label={`Remove ${startup.name}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function WatchlistContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  // "watchlist" and "triggers" are the old tab names; links to them keep working.
  const tab: Tab = tabParam === "watchlist" || tabParam === "watching" ? "watching" : tabParam === "triggers" || tabParam === "alerts" ? "alerts" : "saved";
  const { data: follows, isLoading, isError } = useWatchlist();
  const { data: triggers } = useWatchlistTriggers();

  const all = follows ?? [];
  const watching = all.filter((f) => f.notifyOnUpdate);
  // "Saved" is everything on the watchlist; "Watching" is the part whose updates notify you.
  const shown = tab === "watching" ? watching : all;

  const groups = new Map<string, StartupFollowWithStartup[]>();
  for (const follow of shown) {
    const key = follow.listName?.trim() || UNGROUPED_LABEL;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(follow);
  }
  const orderedGroupNames = [...groups.keys()].sort((a, b) => (a === UNGROUPED_LABEL ? 1 : b === UNGROUPED_LABEL ? -1 : a.localeCompare(b)));

  const tabs: { id: Tab; label: string; count: number | undefined; hint: string }[] = [
    { id: "saved", label: "Saved", count: follows ? all.length : undefined, hint: "Everything you've saved" },
    { id: "watching", label: "Watching", count: follows ? watching.length : undefined, hint: "Their updates notify you" },
    { id: "alerts", label: "Alerts", count: triggers?.length, hint: "Tell me when…" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Watchlist"
        description="Startups you're keeping an eye on, with your own lists and private notes, and alerts for the moments that matter."
        actions={
          <Button size="sm" asChild>
            <Link href="/investor/discover">
              <Compass className="h-4 w-4" aria-hidden="true" /> Discover startups
            </Link>
          </Button>
        }
      />

      <nav aria-label="Watchlist views" className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/investor/watchlist?tab=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            title={item.hint}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === item.id ? "border-brand-primary text-brand-700 dark:text-brand-200" : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-numeric text-[11px] leading-none",
                  tab === item.id ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200" : "bg-background-secondary text-text-secondary",
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "alerts" ? (
        <AlertsTab follows={all} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : shown.length > 0 ? (
        <div className="flex flex-col gap-8">
          {orderedGroupNames.map((groupName) => (
            <section key={groupName} className="flex flex-col gap-3" aria-label={groupName}>
              <h2 className="flex items-center gap-2 title-4 text-text-secondary">
                {groupName}
                <span className="rounded-full bg-background-secondary px-2 py-0.5 font-numeric caption-4">{groups.get(groupName)!.length}</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {groups.get(groupName)!.map((follow) => (
                  <WatchlistCard key={follow.id} follow={follow} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === "watching" ? Eye : Bookmark}
          title={tab === "watching" ? "You're not watching any startup yet" : "No saved startups yet"}
          description={
            tab === "watching"
              ? "Press Watch on a saved startup and its milestones, rounds and updates notify you."
              : "Save startups from Discover or from a connect request and they collect here."
          }
          action={
            <Button size="sm" variant="secondary" asChild>
              <Link href="/investor/discover">Discover startups</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <WatchlistContent />
    </Suspense>
  );
}
