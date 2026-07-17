import { z } from "zod";

/**
 * Generic user-to-user follow (follow a founder, an investor, a mentor…) —
 * deliberately separate from StartupFollow (investor→startup, with its own
 * notifyOnUpdate/watchlist semantics). Plain "follow a person."
 */
export const followSchema = z.object({
  id: z.string().uuid(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Follow = z.infer<typeof followSchema>;

export const followUserInputSchema = z.object({
  userId: z.string().uuid(),
});
export type FollowUserInput = z.infer<typeof followUserInputSchema>;
