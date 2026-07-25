import { z } from "zod";

/**
 * Mirrors apps/api/src/modules/trust/trust-model.ts's TrustResult — the
 * verification-only Trust Score v2, currently shown only to the founder as a
 * preview (`GET /v1/startups/me/trust-preview`) while v1 stays what everyone
 * else sees. See docs/STATUS.md "Trust Score v2" for the shadow-mode rationale.
 */
export const trustV2BandSchema = z.enum(["Starting", "Bronze", "Silver", "Gold", "Platinum"]);
export type TrustV2Band = z.infer<typeof trustV2BandSchema>;

export const trustV2ComponentSchema = z.object({
  key: z.string(),
  label: z.string(),
  max: z.number(),
  earned: z.number(),
  applicability: z.number(),
});
export type TrustV2Component = z.infer<typeof trustV2ComponentSchema>;

export const trustV2NextBestActionSchema = z.object({
  key: z.string(),
  label: z.string(),
  gap: z.number(),
  suggestion: z.string(),
});
export type TrustV2NextBestAction = z.infer<typeof trustV2NextBestActionSchema>;

export const trustV2HistoryPointSchema = z.object({
  score: z.number(),
  band: trustV2BandSchema.or(z.string()),
  computedAt: z.string().datetime(),
});
export type TrustV2HistoryPoint = z.infer<typeof trustV2HistoryPointSchema>;

export const trustV2PreviewSchema = z.object({
  version: z.string(),
  stage: z.string(),
  score: z.number().int().min(0).max(100),
  band: trustV2BandSchema,
  components: z.array(trustV2ComponentSchema),
  penaltyTotal: z.number(),
  nextBestActions: z.array(trustV2NextBestActionSchema),
  history: z.array(trustV2HistoryPointSchema),
});
export type TrustV2Preview = z.infer<typeof trustV2PreviewSchema>;
