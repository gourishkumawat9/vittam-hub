import { z } from "zod";

import { StartupStage, VerificationStatus } from "./enums";

export const startupSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  tagline: z.string().max(160),
  description: z.string().max(5000),
  logoUrl: z.string().url().nullable(),
  website: z.string().url().nullable(),
  industry: z.string().max(80),
  stage: z.nativeEnum(StartupStage),
  foundedYear: z.number().int().min(1990).max(new Date().getFullYear()),
  teamSize: z.number().int().min(1),
  location: z.string().max(120),
  fundingRaisedUsd: z.number().nonnegative().default(0),
  isFundraising: z.boolean().default(false),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Startup = z.infer<typeof startupSchema>;

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

/** Discovery/search filters — shared between the investor search UI and the API query layer. */
export const startupSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  industry: z.array(z.string()).optional(),
  stage: z.array(z.nativeEnum(StartupStage)).optional(),
  location: z.string().optional(),
  isFundraising: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});
export type StartupSearchFilters = z.infer<typeof startupSearchFiltersSchema>;
