import { z } from "zod";

import { VerificationStatus } from "./enums";
import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

export const universityProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  institutionName: z.string().max(160),
  affiliationType: z.string().max(40).nullable(),
  website: httpUrlSchema.nullable(),
  logoUrl: httpUrlSchema.nullable(),
  incubationCellName: z.string().max(160).nullable(),
  departments: z.array(z.string()),
  programsOffered: z.array(z.string()),
  city: z.string().max(80).nullable().optional(),
  state: z.string().max(80).nullable().optional(),
  aisheCode: z.string().max(20).nullable().optional(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UniversityProfileRecord = z.infer<typeof universityProfileSchema>;

const urlOrEmpty = optionalHttpUrlSchema;

/**
 * A university's or institution's profile. `affiliationType` holds the
 * institution type (INSTITUTION_TYPES in ./signup.ts); older profiles may hold
 * free text there, which still validates. The AISHE code is self-declared.
 */
export const createUniversityInputSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required").max(160),
  // Your role there. Stored on your own profile (UserProfile.designation), not the organisation's.
  designation: z.string().trim().min(1, "Add your role there").max(120),
  affiliationType: z.string().min(1, "Pick the type of institution").max(40),
  website: urlOrEmpty,
  logoUrl: urlOrEmpty,
  city: z.string().trim().min(1, "City is required").max(80),
  state: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
  // AISHE codes look like "U-0123", "C-12345" or "S-1234".
  aisheCode: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Za-z0-9-]*$/, "Letters, numbers and - only")
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
  incubationCellName: z.string().max(160).optional(),
  departments: z.array(z.string().max(100)).max(100).default([]),
  programsOffered: z.array(z.string().max(100)).max(100).default([]),
});
export type CreateUniversityInput = z.infer<typeof createUniversityInputSchema>;

/** University directory filters — same shape family as investorSearchFiltersSchema. */
export const universitySearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  departments: z.array(z.string().max(100)).max(50).optional(),
  programsOffered: z.array(z.string().max(100)).max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type UniversitySearchFilters = z.infer<typeof universitySearchFiltersSchema>;
