import { z } from "zod";

import { VerificationStatus } from "./enums";

export const incubatorProgramSchema = z.object({
  name: z.string().min(1, "Program name is required").max(120),
  description: z.string().max(1000).optional(),
  durationWeeks: z.coerce.number().int().positive().optional(),
  applicationCycleStart: z.string().optional(),
  applicationCycleEnd: z.string().optional(),
});
export type IncubatorProgramInput = z.infer<typeof incubatorProgramSchema>;

export const incubatorProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  organizationName: z.string().max(160),
  description: z.string().max(2000).nullable(),
  website: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  industries: z.array(z.string()),
  portfolioCompanies: z.array(z.string()),
  affiliatedMentorCount: z.number().int().nonnegative().nullable(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type IncubatorProfileRecord = z.infer<typeof incubatorProfileSchema>;

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const createIncubatorInputSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(160),
  description: z.string().max(2000).optional(),
  website: urlOrEmpty,
  industries: z.array(z.string().max(80)).min(1, "Select at least one industry"),
  portfolioCompanies: z.array(z.string().max(120)).default([]),
  affiliatedMentorCount: z.coerce.number().int().nonnegative().optional(),
  programs: z.array(incubatorProgramSchema).max(20).default([]),
});
export type CreateIncubatorInput = z.infer<typeof createIncubatorInputSchema>;
