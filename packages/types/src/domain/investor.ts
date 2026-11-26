import { z } from "zod";

import { Currency, InvestorType, StartupStage, VerificationStatus } from "./enums";
import { SEBI_CATEGORIES } from "./signup";
import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

export const investorSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  firmName: z.string().max(120).nullable(),
  designation: z.string().max(120).nullable(),
  investorType: z.nativeEnum(InvestorType),
  bio: z.string().max(3000),
  logoUrl: httpUrlSchema.nullable(),
  website: httpUrlSchema.nullable(),
  currency: z.nativeEnum(Currency).default(Currency.INR),
  checkSizeMinAmount: z.number().nonnegative(),
  checkSizeMaxAmount: z.number().nonnegative(),
  preferredStages: z.array(z.nativeEnum(StartupStage)),
  preferredIndustries: z.array(z.string()),
  preferredGeography: z.array(z.string()),
  portfolioCompanies: z.array(z.string()),
  investmentThesis: z.string().max(3000).nullable(),
  openForPitches: z.boolean(),
  location: z.string().max(120),
  sebiCategory: z.enum(SEBI_CATEGORIES).nullable().optional(),
  sebiRegistrationNumber: z.string().max(40).nullable().optional(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Investor = z.infer<typeof investorSchema>;

const urlOrEmpty = optionalHttpUrlSchema;

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
  industry: z.array(z.string().max(80)).max(50).optional(),
  country: z.array(z.string().max(80)).max(50).optional(),
  stage: z.array(z.nativeEnum(StartupStage)).optional(),
  minTicketSizeAmount: z.coerce.number().nonnegative().optional(),
  investorType: z.array(z.nativeEnum(InvestorType)).optional(),
  portfolioCompanies: z.array(z.string().max(120)).max(50).optional(),
  matchMyStartup: z.coerce.boolean().optional(),
  // "Recently active" = most recently edited profile (updatedAt) — there's no
  // login-tracking column today, so this is the cheapest real signal available.
  sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type InvestorSearchFilters = z.infer<typeof investorSearchFiltersSchema>;

/**
 * An investor's profile. Sign-up asks for the type, what you invest in (sectors
 * and stages), cheque size and where you're based; firm name and your role
 * there are asked of firms (the web form requires them for an organisation).
 * The bio became optional in November 2026 (BHASKAR doesn't ask for one up
 * front); it is stored as "" when left out. SEBI details are self-declared.
 */
export const createInvestorInputSchema = z.object({
  firmName: z.string().max(120).optional(),
  designation: z.string().max(120).optional(),
  investorType: z.nativeEnum(InvestorType, { errorMap: () => ({ message: "Pick the kind of investor you are" }) }),
  website: urlOrEmpty,
  bio: z.string().max(3000).default(""),
  sebiCategory: z.preprocess((value) => (value === "" ? undefined : value), z.enum(SEBI_CATEGORIES).optional()),
  sebiRegistrationNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9/.-]*$/, "Letters, numbers, / . and - only")
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
  preferredIndustries: z.array(z.string().max(80)).min(1, "Select at least one industry").max(40),
  preferredStages: z.array(z.nativeEnum(StartupStage)).min(1, "Select at least one stage").max(20),
  checkSizeMinAmount: z.coerce.number().nonnegative(),
  checkSizeMaxAmount: z.coerce.number().nonnegative(),
  preferredGeography: z.array(z.string().max(80)).max(60).default([]),
  location: z.string().min(1, "Location is required").max(120),
  portfolioCompanies: z.array(z.string().max(120)).max(200).default([]),
  investmentThesis: z.string().max(3000).optional(),
  openForPitches: z.boolean().default(true),
});
export type CreateInvestorInput = z.infer<typeof createInvestorInputSchema>;

export const updateInvestorInputSchema = createInvestorInputSchema.partial();
export type UpdateInvestorInput = z.infer<typeof updateInvestorInputSchema>;
