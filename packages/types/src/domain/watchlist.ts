import { z } from "zod";

/**
 * "Saved" and "Watchlist" are the same relationship with one flag —
 * `notifyOnUpdate: false` is a quiet bookmark, `true` means the investor gets
 * notified on new milestones, funding rounds, etc. See WatchlistService.
 */
export const startupFollowSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  notifyOnUpdate: z.boolean(),
  notes: z.string().nullable(),
  listName: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type StartupFollow = z.infer<typeof startupFollowSchema>;

export const followStartupInputSchema = z.object({
  startupId: z.string().uuid(),
  notifyOnUpdate: z.boolean().default(false),
});
export type FollowStartupInput = z.infer<typeof followStartupInputSchema>;

/** Updates the caller's own notes/list grouping for a startup they've already saved — does not change notifyOnUpdate. */
export const updateWatchlistEntryInputSchema = z.object({
  notes: z.string().max(2000).optional(),
  listName: z.string().max(80).optional(),
});
export type UpdateWatchlistEntryInput = z.infer<typeof updateWatchlistEntryInputSchema>;
