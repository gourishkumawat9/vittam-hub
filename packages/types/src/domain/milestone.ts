import { z } from "zod";

import { MilestoneType } from "./enums";

/** A founder-curated point on the startup's public timeline — see docs/12-connect-requests.md's sibling, the dashboard architecture doc. */
export const startupMilestoneSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid(),
  type: z.nativeEnum(MilestoneType),
  title: z.string().max(160),
  description: z.string().max(1000).nullable(),
  achievedAt: z.string().datetime(),
  evidenceUrls: z.array(z.string().url()),
  createdAt: z.string().datetime(),
});
export type StartupMilestone = z.infer<typeof startupMilestoneSchema>;

export const createMilestoneInputSchema = z.object({
  type: z.nativeEnum(MilestoneType),
  title: z.string().min(1, "Give the milestone a title").max(160),
  description: z.string().max(1000).optional(),
  achievedAt: z.string().min(1, "Date is required"),
  evidenceUrls: z.array(z.string().url()).max(6).default([]),
  // Opt-in, not automatic — a milestone and a community post serve different
  // audiences/tones; the founder decides per-milestone whether to also post it.
  shareToCommunity: z.boolean().default(false),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneInputSchema>;
