import { z } from "zod";

import { SessionType, VerificationStatus } from "./enums";

export const mentorProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  headline: z.string().max(160).nullable(),
  expertise: z.array(z.string()),
  industries: z.array(z.string()),
  yearsExperience: z.number().int().nonnegative().nullable(),
  availability: z.string().max(200).nullable(),
  sessionTypes: z.array(z.nativeEnum(SessionType)),
  pricingModel: z.string().max(80).nullable(),
  languages: z.array(z.string()),
  pastStartups: z.array(z.string()),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MentorProfileRecord = z.infer<typeof mentorProfileSchema>;

export const createMentorInputSchema = z.object({
  headline: z.string().min(1, "Add a short headline").max(160),
  expertise: z.array(z.string().max(60)).min(1, "Select at least one area of expertise"),
  industries: z.array(z.string().max(80)).min(1, "Select at least one industry"),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  availability: z.string().min(1, "Describe your availability").max(200),
  sessionTypes: z.array(z.nativeEnum(SessionType)).min(1, "Select at least one session type"),
  pricingModel: z.string().min(1, "Pricing model is required").max(80),
  languages: z.array(z.string().max(40)).min(1, "Select at least one language"),
  pastStartups: z.array(z.string().max(120)).default([]),
});
export type CreateMentorInput = z.infer<typeof createMentorInputSchema>;

/** Mentor directory filters — same shape family as investorSearchFiltersSchema. */
export const mentorSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  expertise: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  sessionTypes: z.array(z.nativeEnum(SessionType)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type MentorSearchFilters = z.infer<typeof mentorSearchFiltersSchema>;
