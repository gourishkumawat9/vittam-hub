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
import { BarChart3, Bookmark, CalendarDays, Check, ExternalLink, Heart, MapPin, MessageSquare, Rocket, Sparkles, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
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

function CreatePostDialog({
  open,
  onOpenChange,
  role,
  initialType = "FOUNDER_POST",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: UserRole;
  /** The kind of post picked in the composer ("Poll", "Event"…), so the form opens on it. */
  initialType?: PostType;
}) {
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

  // Each time it opens, start on the kind of post the composer asked for.
  useEffect(() => {
    if (open) reset({ type: initialType, mediaUrls: [] });
  }, [open, initialType, reset]);

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

/** Where a new post starts: a prompt to write, and quick picks for the other kinds. */
function Composer({ name, avatarUrl, role, onCompose }: { name: string; avatarUrl: string | null; role?: UserRole; onCompose: (type: PostType) => void }) {
  const quick: { type: PostType; label: string; icon: typeof Rocket }[] = [
    ...(role === "FOUNDER" ? [{ type: "STARTUP_UPDATE" as PostType, label: "Startup update", icon: Rocket }] : []),
    { type: "POLL", label: "Poll", icon: BarChart3 },
    { type: "EVENT", label: "Event", icon: CalendarDays },
  ];
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={avatarUrl} size="md" />
        <button
          type="button"
          onClick={() => onCompose("FOUNDER_POST")}
          className="flex-1 rounded-full border border-border bg-background-secondary px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Share progress or ask the community a question…
        </button>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-border pt-3">
        {quick.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onCompose(item.type)}
            className="flex items-center gap-2 rounded-button px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <item.icon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** The next few events people have posted, soonest first. */
function UpcomingEventsCard() {
  const { data } = useCommunityFeed({ type: ["EVENT"], page: 1, pageSize: 20 });
  const now = Date.now();
  const events = (data?.items ?? [])
    .filter((post) => post.eventStartsAt && new Date(post.eventStartsAt).getTime() > now)
    .sort((a, b) => a.eventStartsAt!.localeCompare(b.eventStartsAt!))
    .slice(0, 3);

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={CalendarDays} title="Upcoming events" />
      {events.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const when = new Date(event.eventStartsAt!);
            return (
              <li key={event.id} className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <span className="text-[10px] font-semibold uppercase leading-none">{when.toLocaleDateString(undefined, { month: "short" })}</span>
                  <span className="font-numeric text-base font-bold leading-tight">{when.getDate()}</span>
                </div>
                <div className="min-w-0">
                  <p className="body-5 line-clamp-2 text-text-primary">{event.body}</p>
                  <p className="caption-5">
                    {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    {event.eventLocation ? ` · ${event.eventLocation}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="caption-5">Nothing coming up. Hosting an AMA, a demo day or a meetup? Post it as an event.</p>
      )}
    </Card>
  );
}

const COMPOSE_PARAM: Record<string, PostType> = { post: "FOUNDER_POST", update: "STARTUP_UPDATE", poll: "POLL", event: "EVENT" };

/** Opens the composer when a link asks for it, e.g. /community?compose=event from a home page. */
function ComposeFromLink({ onCompose }: { onCompose: (type: PostType) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requested = COMPOSE_PARAM[searchParams.get("compose") ?? ""];
  useEffect(() => {
    if (!requested) return;
    onCompose(requested);
    router.replace("/community", { scroll: false });
  }, [requested, onCompose, router]);
  return null;
}

const GUIDELINES = [
  "Share real progress, with numbers when you can",
  "Ask specific questions; you'll get better answers",
  "To reach an investor, send a connect request, not a post",
  "Be generous: answer someone a stage behind you",
];

/**
 * The community feed, laid out like a social product: a composer and the
 * feed in the middle, and on wide screens a side column with upcoming events
 * and how the community works.
 */
export default function CommunityPage() {
  const { data: user } = useCurrentUser();
  const [filters, setFilters] = useState<CommunityFeedFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading, isError, refetch } = useCommunityFeed(filters);
  const [composeType, setComposeType] = useState<PostType | null>(null);
  const items = data?.items ?? [];
  const isFiltered = (filters.type?.length ?? 0) > 0 || !!filters.bookmarkedOnly;
  const compose = (type: PostType) => setComposeType(type);

  const toggleType = (type: PostType) => {
    const current = filters.type ?? [];
    setFilters({ ...filters, type: current.includes(type) ? current.filter((t) => t !== type) : [...current, type], page: 1 });
  };

  const goToPage = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Community"
        description="Updates, questions, polls and events from founders, mentors and investors on VittamHub."
        actions={<Button onClick={() => compose("FOUNDER_POST")}>Create post</Button>}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
          {user && <Composer name={user.fullName} avatarUrl={user.avatarUrl} role={user.role} onCompose={compose} />}

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts">
            <button
              type="button"
              aria-pressed={!isFiltered}
              onClick={() => setFilters({ page: 1, pageSize: 20 })}
              className={chipClass(!isFiltered)}
            >
              All
            </button>
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
                <Button size="sm" onClick={() => compose("FOUNDER_POST")}>
                  Create post
                </Button>
              }
            />
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4" aria-label="Around the community">
          <UpcomingEventsCard />
          <Card className="flex flex-col gap-3">
            <PanelTitle icon={Sparkles} title="How this community works" />
            <ul className="flex flex-col gap-2">
              {GUIDELINES.map((line) => (
                <li key={line} className="flex items-start gap-2 caption-2 text-text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
          {user?.role === "FOUNDER" && (
            <Card className="flex flex-col gap-3 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-background-secondary">
              <p className="title-3">Want a second opinion?</p>
              <p className="caption-2">Mentors take one question at a time. Send a request and they set the time.</p>
              <Button size="sm" variant="secondary" className="w-fit" asChild>
                <Link href="/mentors">Find a mentor</Link>
              </Button>
            </Card>
          )}
        </aside>
      </div>

      <Suspense fallback={null}>
        <ComposeFromLink onCompose={setComposeType} />
      </Suspense>

      <CreatePostDialog
        open={composeType !== null}
        onOpenChange={(open) => !open && setComposeType(null)}
        role={user?.role}
        initialType={composeType ?? "FOUNDER_POST"}
      />
    </div>
  );
}
