import type { DiscussionListItem } from "@vittamhub/api-client";
import { COMMUNITY_DOMAINS, industryToCommunitySlug } from "@vittamhub/types";
import { Badge, Card } from "@vittamhub/ui";
import { CheckCircle2, MessageSquare } from "lucide-react";
import Link from "next/link";

import { AuthorLine } from "./AuthorLine";
import { VoteControl } from "./VoteControl";

export function DiscussionRow({
  discussion,
  currentUserId,
  showCommunity,
}: {
  discussion: DiscussionListItem;
  currentUserId?: string;
  showCommunity?: boolean;
}) {
  return (
    <Card className="flex gap-3 p-4 sm:gap-4">
      <VoteControl
        target="discussion"
        id={discussion.id}
        score={discussion.score}
        myVote={discussion.myVote}
        isOwn={discussion.authorId === currentUserId}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {showCommunity && (
            <Link
              href={`/communities/${industryToCommunitySlug(discussion.industry)}`}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              {COMMUNITY_DOMAINS[discussion.industry].name}
            </Link>
          )}
          {discussion.kind === "QUESTION" ? (
            discussion.isSolved ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Solved
              </Badge>
            ) : (
              <Badge variant="warning">Needs an answer</Badge>
            )
          ) : (
            <Badge variant="neutral">Discussion</Badge>
          )}
        </div>

        <Link
          href={`/communities/discussions/${discussion.id}`}
          className="font-heading text-base font-semibold leading-snug text-text-primary hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {discussion.title}
        </Link>
        <p className="line-clamp-2 text-sm text-text-secondary">{discussion.excerpt}</p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <AuthorLine author={discussion.author} createdAt={discussion.createdAt} />
          <Link
            href={`/communities/discussions/${discussion.id}`}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {discussion.replyCount} {discussion.replyCount === 1 ? "reply" : "replies"}
          </Link>
        </div>
      </div>
    </Card>
  );
}
