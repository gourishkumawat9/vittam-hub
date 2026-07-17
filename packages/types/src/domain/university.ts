import { z } from "zod";

import { VerificationStatus } from "./enums";

export const universityProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  institutionName: z.string().max(160),
  affiliationType: z.string().max(40).nullable(),
  website: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  incubationCellName: z.string().max(160).nullable(),
  departments: z.array(z.string()),
  programsOffered: z.array(z.string()),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UniversityProfileRecord = z.infer<typeof universityProfileSchema>;

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const createUniversityInputSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required").max(160),
  affiliationType: z.string().min(1, "Select an affiliation type").max(40),
  website: urlOrEmpty,
  incubationCellName: z.string().max(160).optional(),
  departments: z.array(z.string().max(100)).default([]),
  programsOffered: z.array(z.string().max(100)).default([]),
});
export type CreateUniversityInput = z.infer<typeof createUniversityInputSchema>;

/** University directory filters — same shape family as investorSearchFiltersSchema. */
export const universitySearchFiltersSchema = z.object({
  departments: z.array(z.string()).optional(),
  programsOffered: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type UniversitySearchFilters = z.infer<typeof universitySearchFiltersSchema>;
