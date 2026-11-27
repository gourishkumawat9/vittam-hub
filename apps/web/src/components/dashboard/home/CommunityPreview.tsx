"use client";

import { useCommunityFeed } from "@vittamhub/api-client";
import { Avatar, Badge, Card, Skeleton } from "@vittamhub/ui";
import { Users } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";

import { PanelLink, PanelTitle } from "../PageHeader";

const TYPE_LABEL: Record<string, string> = {
  FOUNDER_POST: "Post",
  STARTUP_UPDATE: "Startup update",
  ANNOUNCEMENT: "Announcement",
  POLL: "Poll",
  EVENT: "Event",
};

/** The latest few community posts, so every home shows what people are talking about. */
export function CommunityPreview({ limit = 3, emptyHint }: { limit?: number; emptyHint: string }) {
  const { data, isLoading } = useCommunityFeed({ page: 1, pageSize: limit });
  const posts = data?.items ?? [];

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Users} title="From the community" right={<PanelLink href="/community">Open community</PanelLink>} />
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-button bg-background-secondary p-4">
          <p className="body-5 text-text-primary">Nothing posted yet</p>
          <p className="caption-5">{emptyHint}</p>
          <PanelLink href="/community">Write the first post</PanelLink>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id} className="flex items-start gap-3">
              <Avatar name={post.author.fullName} src={post.author.avatarUrl} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="body-5 truncate text-text-primary">{post.author.fullName}</span>
                  <Badge variant="neutral">{TYPE_LABEL[post.type] ?? "Post"}</Badge>
                  <span className="caption-5">{formatRelativeTime(post.createdAt)}</span>
                </div>
                <Link href="/community" className="body-6 line-clamp-2 text-text-secondary transition-colors duration-300 ease-base hover:text-text-primary">
                  {post.body}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
