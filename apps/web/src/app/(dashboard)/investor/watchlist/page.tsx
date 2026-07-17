"use client";

import { useUnfollowStartup, useUpdateWatchlistEntry, useWatchlist, type StartupFollowWithStartup } from "@vittamhub/api-client";
import { Badge, Button, Card, EmptyState, Input, Textarea } from "@vittamhub/ui";
import { Bookmark, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

const UNGROUPED_LABEL = "Unsorted";

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
  const tab = searchParams.get("tab") === "watchlist" ? "watchlist" : "saved";
  const { data: follows, isLoading } = useWatchlist();

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
        <h1 className="font-heading text-2xl font-semibold text-text-primary">{tab === "watchlist" ? "Watchlist" : "Saved Startups"}</h1>
      </div>
      <div className="flex gap-2">
        <Button asChild variant={tab === "saved" ? "primary" : "secondary"} size="sm">
          <Link href="/investor/watchlist?tab=saved">Saved</Link>
        </Button>
        <Button asChild variant={tab === "watchlist" ? "primary" : "secondary"} size="sm">
          <Link href="/investor/watchlist?tab=watchlist">Watchlist</Link>
        </Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
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
    <Suspense fallback={<p className="text-sm text-text-secondary">Loading…</p>}>
      <WatchlistContent />
    </Suspense>
  );
}
