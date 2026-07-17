import { z } from "zod";

/**
 * A mentor's review of a founder after an accepted booking — feeds
 * FounderReputationService. Gated on the booking being ACCEPTED; the
 * comment stays founder-own-view only for now (no public testimonials yet —
 * avoids an unmoderated public text surface with no current demand).
 */
export const founderReviewSchema = z.object({
  id: z.string().uuid(),
  mentorId: z.string().uuid(),
  founderId: z.string().uuid(),
  bookingRequestId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type FounderReview = z.infer<typeof founderReviewSchema>;

export const createFounderReviewInputSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  comment: z.string().max(2000).optional(),
});
export type CreateFounderReviewInput = z.infer<typeof createFounderReviewInputSchema>;
