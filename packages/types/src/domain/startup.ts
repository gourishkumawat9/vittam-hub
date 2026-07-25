import { z } from "zod";

import {
  Currency,
  CustomerModel,
  FundingStatus,
  Industry,
  MetricVisibility,
  ProductStatus,
  ProfileVisibility,
  RevenueStatus,
  StartupStage,
  VerificationStatus,
} from "./enums";

export const startupSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  tagline: z.string().max(160),
  description: z.string().max(5000),
  logoUrl: z.string().url().nullable(),
  website: z.string().url().nullable(),
  industry: z.nativeEnum(Industry),
  stage: z.nativeEnum(StartupStage),
  // Self-reported vs. computed stage axes (CLAUDE.md — declared vs. verified). New/optional; no UI built for these yet.
  declaredStage: z.nativeEnum(StartupStage).nullable().optional(),
  productStatus: z.nativeEnum(ProductStatus).nullable().optional(),
  revenueStatus: z.nativeEnum(RevenueStatus).nullable().optional(),
  fundingStatus: z.nativeEnum(FundingStatus).nullable().optional(),
  monthsInCurrentStage: z.number().int().nonnegative().nullable().optional(),
  foundedYear: z.number().int().min(1990).max(new Date().getFullYear()),
  teamSize: z.number().int().min(1),
  location: z.string().max(120),
  currency: z.nativeEnum(Currency).default(Currency.INR),
  fundingRaisedAmount: z.number().nonnegative().default(0),
  isFundraising: z.boolean().default(false),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean().default(true),
  visibility: z.nativeEnum(ProfileVisibility).default(ProfileVisibility.PUBLIC),
  metricsVisibility: z.nativeEnum(MetricVisibility).default(MetricVisibility.BAND),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Startup = z.infer<typeof startupSchema>;

/** Bundle 30 — the founder's own visibility controls. Separate from the main update flow since it's a distinct, low-frequency "who can see this" decision, not a profile-content edit. */
export const updateStartupVisibilityInputSchema = z.object({
  visibility: z.nativeEnum(ProfileVisibility),
  metricsVisibility: z.nativeEnum(MetricVisibility),
});
export type UpdateStartupVisibilityInput = z.infer<typeof updateStartupVisibilityInputSchema>;

export const createStartupInputSchema = startupSchema.pick({
  name: true,
  tagline: true,
  description: true,
  website: true,
  industry: true,
  stage: true,
  foundedYear: true,
  teamSize: true,
  location: true,
});
export type CreateStartupInput = z.infer<typeof createStartupInputSchema>;

/**
 * Discovery/search filters — shared between the investor search UI and the
 * API query layer. `industry` filters on the closed Industry enum — see
 * StartupsService.search. `query` (Smart Search) matches name, tagline, and
 * the founder's name.
 */
export const startupSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  industry: z.array(z.nativeEnum(Industry)).optional(),
  stage: z.array(z.nativeEnum(StartupStage)).optional(),
  location: z.string().optional(),
  isFundraising: z.boolean().optional(),
  businessModel: z.array(z.nativeEnum(CustomerModel)).optional(),
  technology: z.array(z.string()).optional(),
  minFundingRequirementAmount: z.coerce.number().nonnegative().optional(),
  hasRevenue: z.coerce.boolean().optional(),
  foundedYearMin: z.coerce.number().int().min(1990).optional(),
  foundedYearMax: z.coerce.number().int().min(1990).optional(),
  teamSizeMin: z.coerce.number().int().min(1).optional(),
  teamSizeMax: z.coerce.number().int().min(1).optional(),
  // Caller-controlled opt-in — public/anonymous callers still only ever see
  // VERIFIED startups (enforced server-side in StartupsService.search);
  // this only lets an authenticated investor widen the net to PENDING too.
  verificationStatus: z.array(z.nativeEnum(VerificationStatus)).optional(),
  growthRateMin: z.coerce.number().optional(),
  founderExperienceMin: z.coerce.number().int().nonnegative().optional(),
  matchMyPreferences: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type StartupSearchFilters = z.infer<typeof startupSearchFiltersSchema>;

/** Day-bucketed view log entry — see StartupProfileView in schema.prisma for the throttling rationale. */
export const startupProfileViewSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid(),
  investorId: z.string().uuid(),
  viewDate: z.string(),
  viewCount: z.number().int().positive(),
  createdAt: z.string().datetime(),
});
export type StartupProfileView = z.infer<typeof startupProfileViewSchema>;
