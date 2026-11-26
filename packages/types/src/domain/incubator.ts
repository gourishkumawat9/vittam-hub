import { z } from "zod";

import { optionalDateStringSchema } from "./dates";
import { IncubatorHostType, IncubatorKind, VerificationStatus } from "./enums";
import { GOVERNMENT_INCUBATOR_PROGRAMS } from "./signup";
import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

export const incubatorProgramSchema = z.object({
  name: z.string().min(1, "Program name is required").max(120),
  description: z.string().max(1000).optional(),
  durationWeeks: z.coerce.number().int().positive().optional(),
  applicationCycleStart: optionalDateStringSchema,
  applicationCycleEnd: optionalDateStringSchema,
  applicationUrl: optionalHttpUrlSchema,
  eligibilityCriteria: z.string().max(1000).optional(),
});
export type IncubatorProgramInput = z.infer<typeof incubatorProgramSchema>;

export const incubatorProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  organizationName: z.string().max(160),
  description: z.string().max(2000).nullable(),
  website: httpUrlSchema.nullable(),
  logoUrl: httpUrlSchema.nullable(),
  industries: z.array(z.string()),
  portfolioCompanies: z.array(z.string()),
  affiliatedMentorCount: z.number().int().nonnegative().nullable(),
  kind: z.nativeEnum(IncubatorKind),
  hostType: z.nativeEnum(IncubatorHostType).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  state: z.string().max(80).nullable().optional(),
  yearEstablished: z.number().int().nullable().optional(),
  currentIncubatees: z.number().int().nullable().optional(),
  graduatedIncubatees: z.number().int().nullable().optional(),
  governmentPrograms: z.array(z.enum(GOVERNMENT_INCUBATOR_PROGRAMS)).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type IncubatorProfileRecord = z.infer<typeof incubatorProfileSchema>;

const urlOrEmpty = optionalHttpUrlSchema;

const optionalCount = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().nonnegative().max(100000).optional(),
);

/**
 * An incubator's or accelerator's profile, BHASKAR-style: what it is, who runs
 * it (host type), where, the sectors it backs, then the logo, a description,
 * counts of startups incubated and the government schemes it runs under. The
 * counts and schemes are self-declared (CLAUDE.md §2, §8); nothing here is
 * reviewed by a person.
 */
export const createIncubatorInputSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(160),
  // Your role there. Stored on your own profile (UserProfile.designation), not the organisation's.
  designation: z.string().trim().min(1, "Add your role there").max(120),
  description: z.string().max(2000).optional(),
  website: urlOrEmpty,
  logoUrl: urlOrEmpty,
  industries: z.array(z.string().max(80)).min(1, "Select at least one industry").max(40),
  portfolioCompanies: z.array(z.string().max(120)).max(500).default([]),
  affiliatedMentorCount: optionalCount,
  kind: z.nativeEnum(IncubatorKind).default("INCUBATOR"),
  hostType: z.nativeEnum(IncubatorHostType, { errorMap: () => ({ message: "Say who runs it" }) }),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
  yearEstablished: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1900, "Enter a year from 1900").max(new Date().getFullYear(), "That year hasn't happened yet").optional(),
  ),
  currentIncubatees: optionalCount,
  graduatedIncubatees: optionalCount,
  governmentPrograms: z.array(z.enum(GOVERNMENT_INCUBATOR_PROGRAMS)).max(GOVERNMENT_INCUBATOR_PROGRAMS.length).default([]),
  programs: z.array(incubatorProgramSchema).max(20).default([]),
});
export type CreateIncubatorInput = z.infer<typeof createIncubatorInputSchema>;

/** Incubator directory filters — same shape family as investorSearchFiltersSchema. `kind` lets Accelerators surface as a filter on this same directory. */
export const incubatorSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  industries: z.array(z.string().max(80)).max(50).optional(),
  kind: z.array(z.nativeEnum(IncubatorKind)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type IncubatorSearchFilters = z.infer<typeof incubatorSearchFiltersSchema>;
