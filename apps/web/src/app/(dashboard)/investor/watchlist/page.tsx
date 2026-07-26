"use client";

import {
  useCreateWatchlistTrigger,
  useRemoveWatchlistTrigger,
  useUnfollowStartup,
  useUpdateWatchlistEntry,
  useWatchlist,
  useWatchlistTriggers,
  type StartupFollowWithStartup,
} from "@vittamhub/api-client";
import { WatchlistTriggerType, type CreateWatchlistTriggerInput } from "@vittamhub/types";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Select, Textarea } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Bell, Bookmark, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

const UNGROUPED_LABEL = "Unsorted";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const TRIGGER_TYPE_OPTIONS = Object.values(WatchlistTriggerType).map((value) => ({ label: titleCase(value), value }));
const TRUST_BAND_OPTIONS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((value) => ({ label: titleCase(value), value }));
const AMOUNT_TRIGGER_TYPES = new Set<string>(["REVENUE_ABOVE"]);
const BAND_TRIGGER_TYPES = new Set<string>(["TRUST_BAND_REACHES"]);

function WatchlistTriggersTab({ follows }: { follows: StartupFollowWithStartup[] }) {
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
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Create a trigger</h2>
        <p className="text-xs text-text-secondary">Evaluated hourly. Fires a real alert once its condition is met, never a fabricated notification.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Startup" placeholder="Choose a saved/watched startup…" options={startupOptions} value={startupId} onChange={setStartupId} />
          <Select label="Trigger" options={TRIGGER_TYPE_OPTIONS} value={type} onChange={(v) => setType(v as CreateWatchlistTriggerInput["type"])} />
          {AMOUNT_TRIGGER_TYPES.has(type) && (
            <Input label="Threshold (₹)" type="number" value={thresholdAmount} onChange={(e) => setThresholdAmount(e.target.value)} />
          )}
          {BAND_TRIGGER_TYPES.has(type) && <Select label="Minimum band" options={TRUST_BAND_OPTIONS} value={thresholdBand} onChange={setThresholdBand} />}
        </div>
        <Button size="sm" className="w-fit" onClick={handleCreate} isLoading={createTrigger.isPending} disabled={!startupId}>
          Create trigger
        </Button>
      </Card>

      {isLoading ? (
        <ListRowsSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : triggers && triggers.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {triggers.map((trigger) => (
            <div key={trigger.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{trigger.startup.name}</p>
                <p className="text-xs text-text-secondary">{titleCase(trigger.type)}</p>
              </div>
              <div className="flex items-center gap-2">
                {trigger.firedAt ? (
                  <Badge variant="success">Fired {formatRelativeTime(trigger.firedAt)}</Badge>
                ) : (
                  <Badge variant="neutral">Watching</Badge>
                )}
                <button type="button" onClick={() => removeTrigger.mutate(trigger.id)} className="text-text-secondary hover:text-danger-600" aria-label="Delete trigger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No triggers yet" description="Create one above to get notified automatically." className="py-6" />
      )}
    </div>
  );
}

function WatchlistCard({ follow }: { follow: StartupFollowWithStartup }) {
  const unfollow = useUnfollowStartup();
  const updateEntry = useUpdateWatchlistEntry();
  const [notes, setNotes] = useState(follow.notes ?? "");
  const [listName, setListName] = useState(follow.listName ?? "");

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{follow.startup.name}</h3>
          <p className="text-xs text-text-secondary">{follow.startup.tagline}</p>
        </div>
        <Badge variant="brand">{follow.startup.industry}</Badge>
      </div>

      <Input
        placeholder="List name (e.g. Series A watch)"
        value={listName}
        onChange={(e) => setListName(e.target.value)}
        onBlur={() => {
          if (listName !== (follow.listName ?? "")) updateEntry.mutate({ startupId: follow.startup.id, input: { listName } });
        }}
      />
      <Textarea
        placeholder="Private notes about this startup…"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== (follow.notes ?? "")) updateEntry.mutate({ startupId: follow.startup.id, input: { notes } });
        }}
      />

      <div className="flex items-center justify-between border-t border-border pt-3">
        <Link href={`/startups/${follow.startup.slug}`} className="text-xs font-medium text-brand-primary hover:underline">
          View profile
        </Link>
        <Button size="sm" variant="ghost" onClick={() => unfollow.mutate(follow.startup.id)} isLoading={unfollow.isPending}>
          Remove
        </Button>
      </div>
    </Card>
  );
}

function WatchlistContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "watchlist" ? "watchlist" : tabParam === "triggers" ? "triggers" : "saved";
  const { data: follows, isLoading, isError } = useWatchlist();

  const filtered = (follows ?? []).filter((f) => (tab === "watchlist" ? f.notifyOnUpdate : !f.notifyOnUpdate));

  const groups = new Map<string, StartupFollowWithStartup[]>();
  for (const follow of filtered) {
    const key = follow.listName?.trim() || UNGROUPED_LABEL;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(follow);
  }
  const orderedGroupNames = [...groups.keys()].sort((a, b) => (a === UNGROUPED_LABEL ? 1 : b === UNGROUPED_LABEL ? -1 : a.localeCompare(b)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">
          {tab === "watchlist" ? "Watchlist" : tab === "triggers" ? "Watchlist Alerts" : "Saved Startups"}
        </h1>
      </div>
      <div className="flex gap-2">
        <Button asChild variant={tab === "saved" ? "primary" : "secondary"} size="sm">
          <Link href="/investor/watchlist?tab=saved">Saved</Link>
        </Button>
        <Button asChild variant={tab === "watchlist" ? "primary" : "secondary"} size="sm">
          <Link href="/investor/watchlist?tab=watchlist">Watchlist</Link>
        </Button>
        <Button asChild variant={tab === "triggers" ? "primary" : "secondary"} size="sm">
          <Link href="/investor/watchlist?tab=triggers">Alerts</Link>
        </Button>
      </div>

      {tab === "triggers" ? (
        <WatchlistTriggersTab follows={follows ?? []} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {orderedGroupNames.map((groupName) => (
            <div key={groupName} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-text-secondary">
                {groupName} <span className="font-normal">({groups.get(groupName)!.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.get(groupName)!.map((follow) => (
                  <WatchlistCard key={follow.id} follow={follow} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === "watchlist" ? Sparkles : Bookmark}
          title={tab === "watchlist" ? "Nothing on your watchlist yet" : "No saved startups yet"}
          description="Save startups from Discover Startups to see them here."
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
