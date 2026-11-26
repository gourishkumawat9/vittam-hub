"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAddComment,
  useBookmarkPost,
  useCommunityFeed,
  useCreatePost,
  useCurrentUser,
  useLikePost,
  useMyStartup,
  usePostComments,
  useRemovePost,
  useRsvpToEvent,
  useVotePoll,
  type PostWithRelations,
} from "@vittamhub/api-client";
import { createPostInputSchema, PostType, type CommunityFeedFilters, type CreatePostInput, type UserRole } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Input, Select, TagsInput, Textarea } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Bookmark, CalendarDays, Check, ExternalLink, Heart, MapPin, MessageSquare, Trash2, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { formatDateTime, localInputToIso, nowForLocalInput } from "@/lib/datetime";
import { externalHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<PostType, string> = {
  FOUNDER_POST: "Post",
  STARTUP_UPDATE: "Startup update",
  ANNOUNCEMENT: "Announcement",
  POLL: "Poll",
  EVENT: "Event",
};

const FILTER_LABEL: Record<PostType, string> = {
  FOUNDER_POST: "Posts",
  STARTUP_UPDATE: "Startup updates",
  ANNOUNCEMENT: "Announcements",
  POLL: "Polls",
  EVENT: "Events",
};

const TYPE_FILTER_CHIPS = Object.values(PostType);

/** Only the kinds of post this person can actually publish: the API refuses the rest. */
function postTypeOptions(role: UserRole | undefined, hasStartup: boolean) {
  const types: PostType[] = ["FOUNDER_POST"];
  if (role === "FOUNDER" && hasStartup) types.push("STARTUP_UPDATE");
  types.push("POLL", "EVENT");
  if (role === "ADMIN") types.push("ANNOUNCEMENT");
  return types.map((type) => ({ label: TYPE_LABEL[type], value: type }));
}

const chipClass = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
    active ? "border-brand-primary bg-brand-100 text-brand-700" : "border-border text-text-secondary hover:bg-background-secondary",
  );

function CreatePostDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (open: boolean) => void; role?: UserRole }) {
  const createPost = useCreatePost();
  // Only founders have a startup to post an update for; asking for one on
  // behalf of an investor or mentor was a refused request on every visit.
  const { data: startup } = useMyStartup({ enabled: role === "FOUNDER" });
  const options = useMemo(() => postTypeOptions(role, !!startup), [role, startup]);
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostInputSchema),
    defaultValues: { type: "FOUNDER_POST", mediaUrls: [] },
  });

  const type = watch("type");

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createPost.mutateAsync({
        ...data,
        startupId: data.type === "STARTUP_UPDATE" ? startup?.id : undefined,
        eventStartsAt: data.type === "EVENT" ? localInputToIso(data.eventStartsAt) : undefined,
        eventLocation: data.type === "EVENT" ? data.eventLocation || undefined : undefined,
        eventUrl: data.type === "EVENT" ? data.eventUrl : undefined,
        pollOptions: data.type === "POLL" ? data.pollOptions : undefined,
      });
    } catch {
      return; // the reason is already on screen as a toast; keep what they typed
    }
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create post"
      description="Everyone on VittamHub can see what you post here."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={createPost.isPending}>
            Post
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="type"
          render={({ field }) => <Select label="Type" options={options} value={field.value} onChange={field.onChange} />}
        />
        <Textarea
          label={type === "POLL" ? "Your question" : type === "EVENT" ? "About the event" : "What would you like to share?"}
          rows={4}
          maxLength={5000}
          error={errors.body?.message}
          {...register("body")}
        />

        {type === "POLL" && (
          <Controller
            control={control}
            name="pollOptions"
            render={({ field }) => (
              <TagsInput
                label="Poll options"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Type an option and press Enter"
                error={errors.pollOptions?.message}
              />
            )}
          />
        )}

        {type === "EVENT" && (
          <>
            <Input
              label="Starts at"
              type="datetime-local"
              min={nowForLocalInput()}
              error={errors.eventStartsAt?.message}
              {...register("eventStartsAt")}
            />
            <Input label="Location (optional)" maxLength={200} {...register("eventLocation")} />
            <Input label="Event link (optional)" placeholder="https://…" error={errors.eventUrl?.message} {...register("eventUrl")} />
          </>
        )}
      </form>
    </Dialog>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const { data: comments, isLoading } = usePostComments(postId);
  const addComment = useAddComment(postId);
  const [body, setBody] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || addComment.isPending) return;
    try {
      await addComment.mutateAsync({ body: text });
      setBody("");
    } catch {
      // shown as a toast; the draft stays in the box
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      {isLoading && <ListRowsSkeleton count={2} />}
      {comments?.length === 0 && <p className="text-sm text-text-secondary">No comments yet.</p>}
      {comments?.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar size="sm" name={comment.author.fullName} src={externalHref(comment.author.avatarUrl)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium text-text-primary">{comment.author.fullName}</span>{" "}
              <span className="text-xs text-text-secondary">{formatRelativeTime(comment.createdAt)}</span>
            </p>
            <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{comment.body}</p>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-start gap-2">
        <Input
          aria-label="Write a comment"
          placeholder="Write a comment"
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" size="md" disabled={!body.trim()} isLoading={addComment.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}

function PollBlock({ post, isAuthor }: { post: PostWithRelations; isAuthor: boolean }) {
  const votePoll = useVotePoll();
  const totalVotes = post.pollOptions.reduce((sum, option) => sum + option.voteCount, 0);
  const hasVoted = post.pollOptions.some((option) => option.votedByMe);
  // The tally stays hidden until the reader has voted, so it can't sway the vote. Whoever asked can always see it.
  const showResults = hasVoted || isAuthor;

  return (
    <div className="flex flex-col gap-2">
      {post.pollOptions.map((option) => {
        const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
        return (
          <button
            key={option.id}
            type="button"
            disabled={hasVoted || votePoll.isPending}
            onClick={() => votePoll.mutate(option.id)}
            className={cn(
              "relative overflow-hidden rounded-button border px-3 py-2.5 text-left text-sm text-text-primary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-default",
              option.votedByMe ? "border-brand-primary" : "border-border",
              !hasVoted && "hover:bg-background-secondary",
            )}
          >
            {showResults && <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-brand-100" style={{ width: `${pct}%` }} />}
            <span className="relative flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                {option.votedByMe && <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-label="Your vote" />}
                <span className="break-words">{option.label}</span>
              </span>
              {showResults && <span className="shrink-0 text-xs text-text-secondary">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-text-secondary">
        {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        {showResults ? "" : " · pick one to see the results"}
      </p>
    </div>
  );
}

function EventBlock({ post }: { post: PostWithRelations }) {
  const rsvp = useRsvpToEvent();
  const link = externalHref(post.eventUrl);

  return (
    <div className="flex flex-col gap-3 rounded-button border border-border bg-background-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5 text-sm text-text-secondary">
        {post.eventStartsAt && (
          <span className="flex items-center gap-2 font-medium text-text-primary">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
            {formatDateTime(post.eventStartsAt)}
          </span>
        )}
        {post.eventLocation && (
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{post.eventLocation}</span>
          </span>
        )}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 text-brand-primary hover:underline">
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            Event link
          </a>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-text-secondary">{post._count.rsvps} going</span>
        <Button
          size="sm"
          variant={post.isAttending ? "secondary" : "primary"}
          isLoading={rsvp.isPending}
          aria-pressed={post.isAttending}
          onClick={() => rsvp.mutate({ postId: post.id, attending: !post.isAttending })}
        >
          {post.isAttending ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Going
            </>
          ) : (
            "I'm going"
          )}
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId, canModerate }: { post: PostWithRelations; currentUserId?: string; canModerate: boolean }) {
  const likePost = useLikePost();
  const bookmarkPost = useBookmarkPost();
  const removePost = useRemovePost();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAuthor = post.authorId === currentUserId;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={post.author.fullName} src={externalHref(post.author.avatarUrl)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{post.author.fullName}</p>
            <p className="truncate text-xs text-text-secondary">
              {post.startup ? `${post.startup.name} · ` : ""}
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="brand">{TYPE_LABEL[post.type]}</Badge>
          {(isAuthor || canModerate) && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete post"
              className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background-secondary hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">{post.body}</p>

      {post.type === "POLL" && <PollBlock post={post} isAuthor={isAuthor} />}
      {post.type === "EVENT" && <EventBlock post={post} />}

      <div className="flex items-center gap-1 border-t border-border pt-2 text-sm text-text-secondary">
        <button
          type="button"
          aria-pressed={post.isLiked}
          aria-label={post.isLiked ? "Unlike" : "Like"}
          disabled={likePost.isPending}
          onClick={() => likePost.mutate(post.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-button px-2.5 py-2 transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            post.isLiked && "text-brand-primary",
          )}
        >
          <Heart className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} aria-hidden="true" /> {post._count.likes}
        </button>
        <button
          type="button"
          aria-expanded={commentsOpen}
          aria-label={commentsOpen ? "Hide comments" : "Show comments"}
          onClick={() => setCommentsOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-button px-2.5 py-2 transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" /> {post._count.comments}
        </button>
        <button
          type="button"
          aria-pressed={post.isBookmarked}
          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark post"}
          disabled={bookmarkPost.isPending}
          onClick={() => bookmarkPost.mutate(post.id)}
          className={cn(
            "ml-auto rounded-button p-2 transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            post.isBookmarked && "text-brand-primary",
          )}
        >
          <Bookmark className="h-4 w-4" fill={post.isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>

      {commentsOpen && <CommentsSection postId={post.id} />}

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post?"
        description="Its comments, likes and votes go with it. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              isLoading={removePost.isPending}
              onClick={() => removePost.mutate(post.id, { onSuccess: () => setConfirmDelete(false) })}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-text-secondary">{post.body}</p>
      </Dialog>
    </Card>
  );
}

export default function CommunityPage() {
  const { data: user } = useCurrentUser();
  const [filters, setFilters] = useState<CommunityFeedFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading, isError, refetch } = useCommunityFeed(filters);
  const [createOpen, setCreateOpen] = useState(false);
  const items = data?.items ?? [];
  const isFiltered = (filters.type?.length ?? 0) > 0 || !!filters.bookmarkedOnly;

  const toggleType = (type: PostType) => {
    const current = filters.type ?? [];
    setFilters({ ...filters, type: current.includes(type) ? current.filter((t) => t !== type) : [...current, type], page: 1 });
  };

  const goToPage = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-5">Community</h1>
          <p className="text-sm text-text-secondary">Updates, polls and events from people on VittamHub.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create post</Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts">
        {TYPE_FILTER_CHIPS.map((type) => {
          const active = (filters.type ?? []).includes(type);
          return (
            <button key={type} type="button" aria-pressed={active} onClick={() => toggleType(type)} className={chipClass(active)}>
              {FILTER_LABEL[type]}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={!!filters.bookmarkedOnly}
          onClick={() => setFilters({ ...filters, bookmarkedOnly: !filters.bookmarkedOnly, page: 1 })}
          className={chipClass(!!filters.bookmarkedOnly)}
        >
          Bookmarked
        </button>
      </div>

      {isLoading ? (
        <ListRowsSkeleton count={5} />
      ) : isError ? (
        <EmptyState
          icon={Users}
          title="The feed didn't load"
          description="Check your connection and try again."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length > 0 ? (
        <>
          <div className="flex flex-col gap-4">
            {items.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} canModerate={user?.role === "ADMIN"} />
            ))}
          </div>
          {data && data.totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3" aria-label="Feed pages">
              <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => goToPage(data.page - 1)}>
                Newer
              </Button>
              <span className="text-xs text-text-secondary">
                Page {data.page} of {data.totalPages}
              </span>
              <Button variant="secondary" size="sm" disabled={data.page >= data.totalPages} onClick={() => goToPage(data.page + 1)}>
                Older
              </Button>
            </nav>
          )}
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={Users}
          title="Nothing matches these filters"
          description="Clear the filters to see everything."
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilters({ page: 1, pageSize: 20 })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No posts yet"
          description="Be the first to share an update with the community."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Create post
            </Button>
          }
        />
      )}

      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} role={user?.role} />
    </div>
  );
}
