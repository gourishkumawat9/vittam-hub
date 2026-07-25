import { z } from "zod";

/**
 * The founder's review of a mentor after an accepted booking — spec §5:
 * "the rating can only be left after a genuine booking, so it can't be
 * faked." Feeds MentorReputationService (average rating + session count),
 * the only source of mentor trust since there's no government list of
 * mentors to verify against. Comment is public — unlike FounderReview's,
 * this is the "12 good ratings" social proof a founder is meant to see.
 */
export const mentorReviewSchema = z.object({
  id: z.string().uuid(),
  mentorId: z.string().uuid(),
  founderId: z.string().uuid(),
  bookingRequestId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type MentorReview = z.infer<typeof mentorReviewSchema>;

export const createMentorReviewInputSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  comment: z.string().max(2000).optional(),
});
export type CreateMentorReviewInput = z.infer<typeof createMentorReviewInputSchema>;

export const mentorReputationSchema = z.object({
  averageRating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  sessionsCompleted: z.number().int().nonnegative(),
});
export type MentorReputation = z.infer<typeof mentorReputationSchema>;
