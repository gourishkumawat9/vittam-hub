"use client";

import { useCommunities, useCurrentUser, useDiscussions, useToggleCommunityMembership, type CommunitySummary } from "@vittamhub/api-client";
import { Button, Card, EmptyState, ErrorState } from "@vittamhub/ui";
import { MessagesSquare, Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AskDialog } from "@/components/communities/AskDialog";
import { DiscussionRow } from "@/components/communities/DiscussionRow";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

function CommunityCard({ community }: { community: CommunitySummary }) {
  const toggle = useToggleCommunityMembership();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/communities/${community.slug}`}
          className="font-heading text-base font-semibold text-text-primary hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {community.name}
        </Link>
        <Button
          size="sm"
          variant={community.isMember ? "secondary" : "outline"}
          isLoading={toggle.isPending}
          onClick={() => toggle.mutate({ slug: community.slug, join: !community.isMember })}
          aria-label={community.isMember ? `Leave ${community.name}` : `Join ${community.name}`}
        >
          {community.isMember ? "Joined" : "Join"}
        </Button>
      </div>
      <p className="text-sm text-text-secondary">{community.description}</p>
      <p className="mt-auto flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" /> {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1">
          <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" /> {community.discussionCount}{" "}
          {community.discussionCount === 1 ? "thread" : "threads"}
        </span>
      </p>
    </Card>
  );
}

/**
 * Communities home: your feed on top (threads from the domains you joined, or
 * everything if you haven't joined any), then the domain directory.
 */
export default function CommunitiesPage() {
  const { data: user } = useCurrentUser();
  const communities = useCommunities();
  const [query, setQuery] = useState("");
  const [askOpen, setAskOpen] = useState(false);

  const joinedAny = communities.data?.some((community) => community.isMember) ?? false;
  const feed = useDiscussions({ joined: joinedAny || undefined, sort: "active", pageSize: 10 });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = communities.data ?? [];
    const matches = needle
      ? list.filter((c) => c.name.toLowerCase().includes(needle) || c.description.toLowerCase().includes(needle))
      : list;
    // Joined first, then busiest, so the directory surfaces where the conversation is.
    return [...matches].sort((a, b) => Number(b.isMember) - Number(a.isMember) || b.discussionCount - a.discussionCount);
  }, [communities.data, query]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Communities</h1>
          <p className="text-sm text-text-secondary">
            Ask founders, investors and mentors in your domain. Upvote what helps, and mark the answer that solved it.
          </p>
        </div>
        <Button onClick={() => setAskOpen(true)}>Ask a question</Button>
      </div>

      <section aria-labelledby="feed-heading" className="flex flex-col gap-3">
        <h2 id="feed-heading" className="font-heading text-lg font-semibold text-text-primary">
          {joinedAny ? "From your communities" : "Latest across VittamHub"}
        </h2>
        {feed.isLoading ? (
          <ListRowsSkeleton count={4} />
        ) : feed.isError ? (
          <ErrorState onRetry={() => feed.refetch()} />
        ) : feed.data && feed.data.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {feed.data.items.map((discussion) => (
              <DiscussionRow key={discussion.id} discussion={discussion} currentUserId={user?.id} showCommunity />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="No threads yet"
            description="Start the first one. A specific question gets better answers."
            action={<Button onClick={() => setAskOpen(true)}>Ask a question</Button>}
          />
        )}
      </section>

      <section aria-labelledby="directory-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="directory-heading" className="font-heading text-lg font-semibold text-text-primary">
            Browse by domain
          </h2>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search communities</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fintech, SaaS, D2C…"
              className="h-11 w-full rounded-button border border-border bg-surface pl-9 pr-3 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:text-sm"
            />
          </label>
        </div>

        {communities.isLoading ? (
          <CardGridSkeleton />
        ) : communities.isError ? (
          <ErrorState onRetry={() => communities.refetch()} />
        ) : filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((community) => (
              <CommunityCard key={community.industry} community={community} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Search} title="No community matches that" description="Try a broader word, or post in the Open forum." />
        )}
      </section>

      <AskDialog open={askOpen} onOpenChange={setAskOpen} />
    </div>
  );
}
