import { z } from "zod";

import { documentUploadInputSchema } from "./document";
import {
  CompanyType,
  CustomerModel,
  FundingType,
  HiringStatus,
  LookingForType,
  RegistrationStatus,
  StartupStage,
  TeamMemberCategory,
} from "./enums";

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalString = (max: number) => z.string().max(max).optional();

// ─── Step 2 — Startup Information ────────────────────────────────────────

export const startupInfoStepSchema = z.object({
  name: z.string().min(1, "Startup name is required").max(120),
  tagline: z.string().min(1, "Tagline is required").max(160),
  description: z.string().min(1, "Give a short public description").max(5000),
  logoUrl: urlOrEmpty,
  website: urlOrEmpty,
  stage: z.nativeEnum(StartupStage),
  industry: z.string().min(1, "Industry is required").max(80),
  subIndustry: optionalString(80),
  foundedYear: z.coerce.number().int().min(1990).max(new Date().getFullYear()),
  registrationStatus: z.nativeEnum(RegistrationStatus),
  companyType: z.nativeEnum(CompanyType).optional(),
  headquarters: z.string().min(1, "Headquarters is required").max(120),
  businessModelSummary: optionalString(200),
  mission: optionalString(1000),
  vision: optionalString(1000),
  problemStatement: optionalString(2000),
  solution: optionalString(2000),
  uniqueValueProposition: optionalString(1000),
});
export type StartupInfoStepInput = z.infer<typeof startupInfoStepSchema>;

// ─── Step 3 — Product Details ────────────────────────────────────────────

export const productStepSchema = z.object({
  productName: optionalString(120),
  description: optionalString(2000),
  currentVersion: optionalString(40),
  website: urlOrEmpty,
  appStoreUrl: urlOrEmpty,
  playStoreUrl: urlOrEmpty,
  demoVideoUrl: urlOrEmpty,
  pitchVideoUrl: urlOrEmpty,
  screenshots: z.array(z.string().url()).max(10).default([]),
  technologyStack: z.array(z.string().max(40)).max(30).default([]),
  hasApi: z.boolean().default(false),
});
export type ProductStepInput = z.infer<typeof productStepSchema>;

// ─── Step 4 — Market Details ─────────────────────────────────────────────

export const customerPersonaSchema = z.object({
  name: z.string().max(80),
  description: z.string().max(400),
});

export const competitorSchema = z.object({
  name: z.string().max(120),
  differentiator: z.string().max(400).optional(),
});

export const marketStepSchema = z.object({
  targetAudience: optionalString(500),
  targetGeography: z.array(z.string().max(80)).max(50).default([]),
  primaryCustomer: optionalString(200),
  customerModel: z.array(z.nativeEnum(CustomerModel)).default([]),
  tamUsd: z.coerce.number().nonnegative().optional(),
  samUsd: z.coerce.number().nonnegative().optional(),
  somUsd: z.coerce.number().nonnegative().optional(),
  customerPersonas: z.array(customerPersonaSchema).max(10).default([]),
  competitors: z.array(competitorSchema).max(15).default([]),
  competitiveAdvantage: optionalString(1000),
  goToMarketStrategy: optionalString(1000),
});
export type MarketStepInput = z.infer<typeof marketStepSchema>;

// ─── Step 5 — Team Details ────────────────────────────────────────────────

export const teamMemberInputSchema = z.object({
  category: z.nativeEnum(TeamMemberCategory),
  fullName: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  linkedinUrl: urlOrEmpty,
  photoUrl: urlOrEmpty,
});
export type TeamMemberInput = z.infer<typeof teamMemberInputSchema>;

export const teamStepSchema = z.object({
  members: z.array(teamMemberInputSchema).max(50).default([]),
  hiringStatus: z.nativeEnum(HiringStatus),
  openRoles: z.array(z.string().max(80)).max(20).default([]),
  teamSize: z.coerce.number().int().min(1).max(100000),
});
export type TeamStepInput = z.infer<typeof teamStepSchema>;

// ─── Step 6 — Traction ────────────────────────────────────────────────────

export const tractionStepSchema = z.object({
  monthlyRevenueUsd: z.coerce.number().nonnegative().optional(),
  arrUsd: z.coerce.number().nonnegative().optional(),
  mrrUsd: z.coerce.number().nonnegative().optional(),
  totalUsers: z.coerce.number().int().nonnegative().optional(),
  totalCustomers: z.coerce.number().int().nonnegative().optional(),
  downloads: z.coerce.number().int().nonnegative().optional(),
  retentionRatePercent: z.coerce.number().min(0).max(100).optional(),
  growthRatePercent: z.coerce.number().optional(),
  partnerships: z.array(z.string().max(120)).max(30).default([]),
  awards: z.array(z.string().max(120)).max(30).default([]),
  patents: z.array(z.string().max(120)).max(30).default([]),
  mediaMentions: z.array(z.string().max(120)).max(30).default([]),
});
export type TractionStepInput = z.infer<typeof tractionStepSchema>;

// ─── Step 7 — Funding ─────────────────────────────────────────────────────

export const fundingStepSchema = z.object({
  fundingTypes: z.array(z.nativeEnum(FundingType)).default([]),
  currentRaiseUsd: z.coerce.number().nonnegative().optional(),
  fundingGoalUsd: z.coerce.number().nonnegative().optional(),
  valuationUsd: z.coerce.number().nonnegative().optional(),
  previousInvestors: z.array(z.string().max(120)).max(50).default([]),
  useOfFunds: optionalString(1000),
  runwayMonths: z.coerce.number().int().nonnegative().optional(),
  monthlyBurnRateUsd: z.coerce.number().nonnegative().optional(),
});
export type FundingStepInput = z.infer<typeof fundingStepSchema>;

// ─── Step 8 — Verification documents ──────────────────────────────────────
// (documentUploadInputSchema lives in ./document — Document is a generic,
// user-level model shared by every role's verification step, not startup-specific)

export const verificationStepSchema = z.object({
  documents: z.array(documentUploadInputSchema).max(20).default([]),
});
export type VerificationStepInput = z.infer<typeof verificationStepSchema>;

// ─── Step 9 — Preferences ──────────────────────────────────────────────────

export const preferencesStepSchema = z.object({
  lookingFor: z.array(z.nativeEnum(LookingForType)).min(1, "Select at least one option"),
});
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;

// ─── Step 10 — Review & publish ───────────────────────────────────────────

export const publishStartupInputSchema = z.object({
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  signatureFullName: z.string().min(1, "Type your full legal name to sign"),
});
export type PublishStartupInput = z.infer<typeof publishStartupInputSchema>;

// ─── The complete draft, as accumulated in UserProfile.onboardingDraft ───

export const startupOnboardingDraftSchema = z.object({
  personalDetails: z.record(z.unknown()).optional(), // validated against personalDetailsInputSchema separately (shared across roles)
  startupInfo: startupInfoStepSchema.partial().optional(),
  product: productStepSchema.partial().optional(),
  market: marketStepSchema.partial().optional(),
  team: teamStepSchema.partial().optional(),
  traction: tractionStepSchema.partial().optional(),
  funding: fundingStepSchema.partial().optional(),
  verification: verificationStepSchema.partial().optional(),
  preferences: preferencesStepSchema.partial().optional(),
});
export type StartupOnboardingDraft = z.infer<typeof startupOnboardingDraftSchema>;

export const STARTUP_WIZARD_STEPS = [
  "personal-details",
  "startup-info",
  "product",
  "market",
  "team",
  "traction",
  "funding",
  "verification",
  "preferences",
  "review",
] as const;
export type StartupWizardStep = (typeof STARTUP_WIZARD_STEPS)[number];
