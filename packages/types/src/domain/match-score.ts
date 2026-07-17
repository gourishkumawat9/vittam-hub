import { z } from "zod";

/**
 * A deterministic, transparent "fit" score between one investor and one
 * startup — every reason is a real, computable overlap (shared industry,
 * matching stage, funding within check size, shared geography). This is
 * NOT a machine-learning model; "AI Investor Matching" (a smarter, learned
 * ranking) is intentionally future-scoped — see CLAUDE.md future-modules.
 */
export const matchScoreReasonSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number().int().positive(),
  matched: z.boolean(),
});
export type MatchScoreReason = z.infer<typeof matchScoreReasonSchema>;

export const matchScoreSchema = z.object({
  startupId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  reasons: z.array(matchScoreReasonSchema),
});
export type MatchScore = z.infer<typeof matchScoreSchema>;

/** Same fit computation as matchScoreSchema, keyed by investor instead — the founder's-side view of MatchScoreService.scoreForStartup. */
export const investorMatchScoreSchema = z.object({
  investorId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  reasons: z.array(matchScoreReasonSchema),
});
export type InvestorMatchScore = z.infer<typeof investorMatchScoreSchema>;
