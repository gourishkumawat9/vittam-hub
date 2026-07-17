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
import { createPostInputSchema, PostType, type CommunityFeedFilters, type CreatePostInput } from "@vittamhub/types";
import { Badge, Button, Card, Dialog, EmptyState, Input, Select, TagsInput, Textarea } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Bookmark, Heart, MessageSquare, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

const TYPE_LABEL: Record<PostType, string> = {
  FOUNDER_POST: "Founder Post",
  STARTUP_UPDATE: "Startup Update",
  ANNOUNCEMENT: "Announcement",
  POLL: "Poll",
  EVENT: "Event",
};

const TYPE_FILTER_CHIPS = Object.values(PostType);

const POST_TYPE_OPTIONS = Object.values(PostType).map((type) => ({ label: TYPE_LABEL[type], value: type }));

function CreatePostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createPost = useCreatePost();
  const { data: startup } = useMyStartup();
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
    await createPost.mutateAsync({
      ...data,
      startupId: data.type === "STARTUP_UPDATE" ? startup?.id : undefined,
    });
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create post"
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
          render={({ field }) => <Select label="Type" options={POST_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <Textarea label="What's on your mind?" rows={4} error={errors.body?.message} {...register("body")} />

        {type === "POLL" && (
          <Controller
            control={control}
            name="pollOptions"
            render={({ field }) => (
              <TagsInput
                label="Poll options"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Type an option and press enter…"
                error={errors.pollOptions?.message}
              />
            )}
          />
        )}

        {type === "EVENT" && (
          <>
            <Input label="Starts at" type="datetime-local" error={errors.eventStartsAt?.message} {...register("eventStartsAt")} />
            <Input label="Location (optional)" {...register("eventLocation")} />
            <Input label="Event link (optional)" placeholder="https://…" {...register("eventUrl")} />
          </>
        )}
      </form>
    </Dialog>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const { data: comments } = usePostComments(postId);
  const addComment = useAddComment(postId);
  const [body, setBody] = useState("");

  const submit = async () => {
    if (!body.trim()) return;
    await addComment.mutateAsync({ body });
    setBody("");
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      {comments?.map((comment) => (
        <div key={comment.id} className="text-sm">
          <span className="font-medium text-text-primary">{comment.author.fullName}</span>{" "}
          <span className="text-text-secondary">{comment.body}</span>
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="Write a comment…" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button size="sm" onClick={submit} isLoading={addComment.isPending}>
          Send
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId }: { post: PostWithRelations; currentUserId?: string }) {
  const likePost = useLikePost();
  const bookmarkPost = useBookmarkPost();
  const votePoll = useVotePoll();
  const rsvp = useRsvpToEvent();
  const removePost = useRemovePost();
  const [commentsOpen, setCommentsOpen] = useState(false);

  const totalVotes = post.pollOptions.reduce((sum, option) => sum + option.votes.length, 0);
  const hasVoted = post.pollOptions.some((option) => option.votes.some((vote) => vote.userId === currentUserId));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">{post.author.fullName}</p>
          <p className="text-xs text-text-secondary">
            {TYPE_LABEL[post.type]}
            {post.startup ? ` · ${post.startup.name}` : ""} · {formatRelativeTime(post.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">{TYPE_LABEL[post.type]}</Badge>
          {post.authorId === currentUserId && (
            <button type="button" onClick={() => removePost.mutate(post.id)} aria-label="Delete post">
              <Trash2 className="h-3.5 w-3.5 text-text-secondary hover:text-danger-600" />
            </button>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm text-text-secondary">{post.body}</p>

      {post.type === "POLL" && (
        <div className="flex flex-col gap-2">
          {post.pollOptions.map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                type="button"
                disabled={hasVoted}
                onClick={() => votePoll.mutate(option.id)}
                className="flex items-center justify-between rounded-button border border-border px-3 py-2 text-sm text-text-primary hover:bg-background-secondary disabled:cursor-default"
              >
                <span>{option.label}</span>
                <span className="text-xs text-text-secondary">
                  {option.votes.length} vote{option.votes.length === 1 ? "" : "s"} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {post.type === "EVENT" && (
        <div className="flex flex-wrap items-center gap-3 rounded-button border border-border px-3 py-2 text-xs text-text-secondary">
          {post.eventStartsAt && <span>{new Date(post.eventStartsAt).toLocaleString()}</span>}
          {post.eventLocation && <span>{post.eventLocation}</span>}
          <Button size="sm" isLoading={rsvp.isPending} onClick={() => rsvp.mutate({ postId: post.id, attending: true })}>
            <Users className="h-3.5 w-3.5" /> RSVP ({post._count.rsvps})
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-text-secondary">
        <button type="button" className="flex items-center gap-1 hover:text-text-primary" onClick={() => likePost.mutate(post.id)}>
          <Heart className="h-3.5 w-3.5" /> {post._count.likes}
        </button>
        <button type="button" className="flex items-center gap-1 hover:text-text-primary" onClick={() => setCommentsOpen((v) => !v)}>
          <MessageSquare className="h-3.5 w-3.5" /> {post._count.comments}
        </button>
        <button
          type="button"
          className={`ml-auto flex items-center gap-1 hover:text-text-primary ${post.isBookmarked ? "text-brand-primary" : ""}`}
          onClick={() => bookmarkPost.mutate(post.id)}
          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark post"}
        >
          <Bookmark className="h-3.5 w-3.5" fill={post.isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {commentsOpen && <CommentsSection postId={post.id} />}
    </Card>
  );
}

export default function CommunityPage() {
  const { data: user } = useCurrentUser();
  const [filters, setFilters] = useState<CommunityFeedFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useCommunityFeed(filters);
  const [createOpen, setCreateOpen] = useState(false);
  const items = data?.items ?? [];

  const toggleType = (type: PostType) => {
    const current = filters.type ?? [];
    setFilters({ ...filters, type: current.includes(type) ? current.filter((t) => t !== type) : [...current, type], page: 1 });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Community</h1>
          <p className="text-sm text-text-secondary">Updates, announcements, polls, and events from across VittamHub.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create post</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTER_CHIPS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (filters.type ?? []).includes(type)
                ? "border-brand-primary bg-brand-100 text-brand-700"
                : "border-border text-text-secondary hover:bg-background-secondary"
            }`}
          >
            {TYPE_LABEL[type]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilters({ ...filters, bookmarkedOnly: !filters.bookmarkedOnly, page: 1 })}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filters.bookmarkedOnly
              ? "border-brand-primary bg-brand-100 text-brand-700"
              : "border-border text-text-secondary hover:bg-background-secondary"
          }`}
        >
          Bookmarked
        </button>
      </div>

      {isLoading ? (
        <ListRowsSkeleton count={5} />
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-4">
          {items.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No posts yet" description="Be the first to share an update with the community." />
      )}

      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
