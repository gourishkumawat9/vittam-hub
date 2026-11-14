import { z } from "zod";

import { PostType } from "./enums";
import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  startupId: z.string().uuid().nullable(),
  type: z.nativeEnum(PostType),
  body: z.string().max(5000),
  mediaUrls: z.array(httpUrlSchema),
  eventStartsAt: z.string().datetime().nullable(),
  eventLocation: z.string().nullable(),
  eventUrl: httpUrlSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Post = z.infer<typeof postSchema>;

export const createPostInputSchema = z
  .object({
    startupId: z.string().uuid().optional(),
    type: z.nativeEnum(PostType),
    body: z.string().min(1, "Say something").max(5000),
    mediaUrls: z.array(httpUrlSchema).max(10).default([]),
    // Checked to be a real date so a bad value is a clear 400, not a database error.
    eventStartsAt: z
      .string()
      .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), { message: "Pick a valid date and time" })
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    eventLocation: z.string().max(200).optional(),
    eventUrl: optionalHttpUrlSchema,
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
