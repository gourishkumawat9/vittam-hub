import { z } from "zod";

/**
 * Trust Score is always computed, never manually assigned — see
 * TrustScoreService (apps/api/src/modules/startups/trust-score.service.ts).
 * Each factor is worth a fixed share of 100; `earned` is which ones currently
 * apply, so the UI can render both the number and *why*.
 */
export const trustScoreFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number().int().positive(),
  earned: z.boolean(),
});
export type TrustScoreFactor = z.infer<typeof trustScoreFactorSchema>;

/** Low/Medium/High/Excellent — the only form of the score ever shown to anyone other than the owner. Never expose the raw factors breakdown externally. */
export const scoreBandSchema = z.enum(["LOW", "MEDIUM", "HIGH", "EXCELLENT"]);
export type ScoreBand = z.infer<typeof scoreBandSchema>;

export const trustScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: scoreBandSchema,
  factors: z.array(trustScoreFactorSchema),
});
export type TrustScore = z.infer<typeof trustScoreSchema>;

/** What investors/the public see: a score + qualitative band, no factor-by-factor breakdown. */
export const trustScoreSummarySchema = z.object({
  score: z.number().int().min(0).max(100),
  band: scoreBandSchema,
});
export type TrustScoreSummary = z.infer<typeof trustScoreSummarySchema>;

/**
 * A separate axis from Trust Score: Trust Score asks "is this startup real
 * and complete," Founder Reputation asks "is this founder good to work
 * with professionally" (activity, community participation, mentor reviews,
 * tenure). Never merged into one number — see FounderReputationService.
 */
export const founderReputationSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: scoreBandSchema,
  factors: z.array(trustScoreFactorSchema),
});
export type FounderReputation = z.infer<typeof founderReputationSchema>;

export const founderReputationSummarySchema = z.object({
  score: z.number().int().min(0).max(100),
  band: scoreBandSchema,
});
export type FounderReputationSummary = z.infer<typeof founderReputationSummarySchema>;

/** One missing piece of the profile, with enough info for the dashboard card to deep-link straight to the fix. */
export const missingProfileItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  href: z.string(),
});
export type MissingProfileItem = z.infer<typeof missingProfileItemSchema>;

export const profileCompletionSchema = z.object({
  percent: z.number().int().min(0).max(100),
  missing: z.array(missingProfileItemSchema),
});
export type ProfileCompletion = z.infer<typeof profileCompletionSchema>;

/** The founder dashboard's single "health" call — trust score + completion + founder reputation in one round trip. */
export const startupHealthSchema = z.object({
  trustScore: trustScoreSchema,
  profileCompletion: profileCompletionSchema,
  founderReputation: founderReputationSchema,
});
export type StartupHealth = z.infer<typeof startupHealthSchema>;
