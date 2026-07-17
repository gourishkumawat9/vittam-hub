import { z } from "zod";

import { InvestorType, StartupStage, VerificationStatus } from "./enums";

export const investorSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  firmName: z.string().max(120).nullable(),
  designation: z.string().max(120).nullable(),
  investorType: z.nativeEnum(InvestorType),
  bio: z.string().max(3000),
  logoUrl: z.string().url().nullable(),
  website: z.string().url().nullable(),
  checkSizeMinUsd: z.number().nonnegative(),
  checkSizeMaxUsd: z.number().nonnegative(),
  preferredStages: z.array(z.nativeEnum(StartupStage)),
  preferredIndustries: z.array(z.string()),
  preferredGeography: z.array(z.string()),
  portfolioCompanies: z.array(z.string()),
  investmentThesis: z.string().max(3000).nullable(),
  openForPitches: z.boolean(),
  location: z.string().max(120),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Investor = z.infer<typeof investorSchema>;

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

// "LinkedIn" from the spec's Investor field list is collected once, on the
// shared Personal Details step (UserProfile.linkedinUrl) — not duplicated
// here. "Investment Type" is this schema's `investorType` field.
/**
 * Investor discovery filters — the mirror image of startupSearchFiltersSchema.
 * `matchMyStartup` asks the API to default industry/stage to the caller's own
 * startup when no explicit filters are given (see InvestorsService.list).
 */
export const investorSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  industry: z.array(z.string()).optional(),
  country: z.array(z.string()).optional(),
  stage: z.array(z.nativeEnum(StartupStage)).optional(),
  minTicketSizeUsd: z.coerce.number().nonnegative().optional(),
  investorType: z.array(z.nativeEnum(InvestorType)).optional(),
  portfolioCompanies: z.array(z.string()).optional(),
  matchMyStartup: z.coerce.boolean().optional(),
  // "Recently active" = most recently edited profile (updatedAt) — there's no
  // login-tracking column today, so this is the cheapest real signal available.
  sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type InvestorSearchFilters = z.infer<typeof investorSearchFiltersSchema>;

export const createInvestorInputSchema = z.object({
  firmName: z.string().max(120).optional(),
  designation: z.string().max(120).optional(),
  investorType: z.nativeEnum(InvestorType),
  website: urlOrEmpty,
  bio: z.string().min(1, "Tell startups about yourself").max(3000),
  preferredIndustries: z.array(z.string().max(80)).min(1, "Select at least one industry"),
  preferredStages: z.array(z.nativeEnum(StartupStage)).min(1, "Select at least one stage"),
  checkSizeMinUsd: z.coerce.number().nonnegative(),
  checkSizeMaxUsd: z.coerce.number().nonnegative(),
  preferredGeography: z.array(z.string().max(80)).default([]),
  location: z.string().min(1, "Location is required").max(120),
  portfolioCompanies: z.array(z.string().max(120)).default([]),
  investmentThesis: z.string().max(3000).optional(),
  openForPitches: z.boolean().default(true),
});
export type CreateInvestorInput = z.infer<typeof createInvestorInputSchema>;

export const updateInvestorInputSchema = createInvestorInputSchema.partial();
export type UpdateInvestorInput = z.infer<typeof updateInvestorInputSchema>;
