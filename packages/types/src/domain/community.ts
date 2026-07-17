import { z } from "zod";

import { PostType } from "./enums";

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  startupId: z.string().uuid().nullable(),
  type: z.nativeEnum(PostType),
  body: z.string().max(5000),
  mediaUrls: z.array(z.string().url()),
  eventStartsAt: z.string().datetime().nullable(),
  eventLocation: z.string().nullable(),
  eventUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Post = z.infer<typeof postSchema>;

export const createPostInputSchema = z
  .object({
    startupId: z.string().uuid().optional(),
    type: z.nativeEnum(PostType),
    body: z.string().min(1, "Say something").max(5000),
    mediaUrls: z.array(z.string().url()).max(10).default([]),
    eventStartsAt: z.string().optional(),
    eventLocation: z.string().max(200).optional(),
    eventUrl: z.string().url().optional(),
    pollOptions: z.array(z.string().min(1).max(120)).min(2).max(10).optional(),
  })
  .refine((data) => data.type !== "POLL" || (data.pollOptions?.length ?? 0) >= 2, {
    message: "A poll needs at least two options",
    path: ["pollOptions"],
  })
  .refine((data) => data.type !== "EVENT" || !!data.eventStartsAt, {
    message: "An event needs a start time",
    path: ["eventStartsAt"],
  });
export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const communityFeedFiltersSchema = z.object({
  type: z.array(z.nativeEnum(PostType)).optional(),
  startupId: z.string().uuid().optional(),
  bookmarkedOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type CommunityFeedFilters = z.infer<typeof communityFeedFiltersSchema>;

export const commentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  body: z.string().max(2000),
  createdAt: z.string().datetime(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({
  body: z.string().min(1, "Say something").max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

export const pollOptionSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  label: z.string(),
  order: z.number().int(),
});
export type PollOption = z.infer<typeof pollOptionSchema>;

export const castVoteInputSchema = z.object({
  pollOptionId: z.string().uuid(),
});
export type CastVoteInput = z.infer<typeof castVoteInputSchema>;

export const postBookmarkSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type PostBookmark = z.infer<typeof postBookmarkSchema>;
