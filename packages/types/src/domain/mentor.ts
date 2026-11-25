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

/**
 * A mentor's profile. Sign-up asks only for what a founder needs to decide
 * whether to request a session (headline, expertise, session types and when
 * you are free); the rest is optional and can be added later. An optional
 * field left empty is stored as empty (null), so clearing one sticks.
 */
export const createMentorInputSchema = z.object({
  headline: z.string().min(1, "Add a short headline").max(160),
  expertise: z.array(z.string().max(60)).min(1, "Add at least one area you can help with").max(30),
  industries: z.array(z.string().max(80)).max(40).default([]),
  yearsExperience: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? null : value),
    z.coerce.number().int().min(0).max(80).nullable(),
  ),
  availability: z.string().min(1, "Say when founders can book you").max(200),
  sessionTypes: z.array(z.nativeEnum(SessionType)).min(1, "Pick at least one kind of session").max(10),
  pricingModel: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().max(80).nullable(),
  ),
  languages: z.array(z.string().max(40)).max(30).default([]),
  pastStartups: z.array(z.string().max(120)).max(100).default([]),
});
export type CreateMentorInput = z.infer<typeof createMentorInputSchema>;

/** Mentor directory filters — same shape family as investorSearchFiltersSchema. */
export const mentorSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  expertise: z.array(z.string().max(60)).max(50).optional(),
  industries: z.array(z.string().max(80)).max(50).optional(),
  sessionTypes: z.array(z.nativeEnum(SessionType)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type MentorSearchFilters = z.infer<typeof mentorSearchFiltersSchema>;
