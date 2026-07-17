import { z } from "zod";

/**
 * A computed, read-time merge across milestones/updates/jobs/traction (and,
 * owner-only, connection requests received + non-sensitive document uploads)
 * — never a denormalized write-side table, matching RecommendationsService's
 * "always a real DB aggregate" philosophy. See FounderActivityService.
 */
export const founderActivityEntryTypeSchema = z.enum([
  "MILESTONE",
  "STARTUP_UPDATE",
  "JOB_POSTED",
  "TRACTION_UPDATED",
  "CONNECTION_RECEIVED",
  "DOCUMENT_UPLOADED",
  "VERIFICATION_COMPLETED",
]);
export type FounderActivityEntryType = z.infer<typeof founderActivityEntryTypeSchema>;

export const founderActivityEntrySchema = z.object({
  id: z.string(),
  type: founderActivityEntryTypeSchema,
  occurredAt: z.string().datetime(),
  title: z.string(),
  description: z.string().nullable(),
});
export type FounderActivityEntry = z.infer<typeof founderActivityEntrySchema>;
