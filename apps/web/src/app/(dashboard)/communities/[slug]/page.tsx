"use client";

import { useCurrentUser, useDiscussions, useDomainCommunity, useToggleCommunityMembership } from "@vittamhub/api-client";
import { communitySlugToIndustry, type DiscussionSort } from "@vittamhub/types";
import { Button, EmptyState, ErrorState } from "@vittamhub/ui";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AskDialog } from "@/components/communities/AskDialog";
import { DiscussionRow } from "@/components/communities/DiscussionRow";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { cn } from "@/lib/utils";

const SORTS: { value: DiscussionSort; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
  { value: "unsolved", label: "Unanswered" },
];

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const industry = communitySlugToIndustry(slug);
  const { data: user } = useCurrentUser();
  const community = useDomainCommunity(industry ? slug : "");
  const toggle = useToggleCommunityMembership();
  const [sort, setSort] = useState<DiscussionSort>("active");
  const [page, setPage] = useState(1);
  const [askOpen, setAskOpen] = useState(false);
  const discussions = useDiscussions({ industry, sort, page, pageSize: 20 });

  if (!industry) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="That community doesn't exist"
        action={
          <Link href="/communities" className="text-sm font-medium text-brand-primary hover:underline">
            See all communities
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/communities" className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All communities
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">{community.data?.name ?? " "}</h1>
          <p className="mt-1 text-sm text-text-secondary">{community.data?.description}</p>
          {community.data && (
            <p className="mt-2 text-xs text-text-secondary">
              {community.data.memberCount} {community.data.memberCount === 1 ? "member" : "members"} · {community.data.discussionCount}{" "}
              {community.data.discussionCount === 1 ? "thread" : "threads"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {community.data && (
            <Button
              variant={community.data.isMember ? "secondary" : "outline"}
              isLoading={toggle.isPending}
              onClick={() => toggle.mutate({ slug, join: !community.data!.isMember })}
            >
              {community.data.isMember ? "Joined" : "Join"}
            </Button>
          )}
          <Button onClick={() => setAskOpen(true)}>Ask a question</Button>
        </div>
      </header>

      <div role="tablist" aria-label="Sort threads" className="flex gap-1 overflow-x-auto border-b border-border">
        {SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={sort === option.value}
            onClick={() => {
              setSort(option.value);
              setPage(1);
            }}
            className={cn(
              "relative min-h-[44px] shrink-0 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              sort === option.value
                ? "text-brand-700 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {discussions.isLoading ? (
        <ListRowsSkeleton count={5} />
      ) : discussions.isError ? (
        <ErrorState onRetry={() => discussions.refetch()} />
      ) : discussions.data && discussions.data.items.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {discussions.data.items.map((discussion) => (
              <DiscussionRow key={discussion.id} discussion={discussion} currentUserId={user?.id} />
            ))}
          </div>
          {discussions.data.totalPages > 1 && (
            <nav className="flex items-center justify-between" aria-label="Pagination">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {discussions.data.page} of {discussions.data.totalPages}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= discussions.data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title={sort === "unsolved" ? "Every question here has an answer" : "No threads here yet"}
          description={sort === "unsolved" ? undefined : `Be the first to ask the ${community.data?.name ?? ""} community.`}
          action={sort === "unsolved" ? undefined : <Button onClick={() => setAskOpen(true)}>Ask a question</Button>}
        />
      )}

      <AskDialog open={askOpen} onOpenChange={setAskOpen} defaultIndustry={industry} />
    </div>
  );
}
