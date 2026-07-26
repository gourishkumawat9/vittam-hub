import { z } from "zod";

import { WatchlistTriggerType } from "./enums";

const trustBandSchema = z.enum(["STARTING", "BRONZE", "SILVER", "GOLD", "PLATINUM"]);

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

/**
 * "Notify when Revenue > target / Trust Score reaches Gold / GST verified /
 * ..." (Investor Workspace §4). Evaluated by a recurring job, fires once
 * (`firedAt` set) via the existing Notification system — see
 * WatchlistTriggerEvaluatorService.
 */
export const watchlistTriggerSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  type: z.nativeEnum(WatchlistTriggerType),
  thresholdAmount: z.number().nonnegative().nullable(),
  thresholdBand: trustBandSchema.nullable(),
  baselineValue: z.number().int().nullable(),
  isActive: z.boolean(),
  firedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type WatchlistTrigger = z.infer<typeof watchlistTriggerSchema>;

export const createWatchlistTriggerInputSchema = z.object({
  startupId: z.string().uuid(),
  type: z.nativeEnum(WatchlistTriggerType),
  thresholdAmount: z.coerce.number().nonnegative().optional(),
  thresholdBand: trustBandSchema.optional(),
});
export type CreateWatchlistTriggerInput = z.infer<typeof createWatchlistTriggerInputSchema>;
