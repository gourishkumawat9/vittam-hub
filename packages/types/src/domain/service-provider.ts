import { z } from "zod";

import { ServiceCategory, VerificationStatus } from "./enums";

export const serviceProviderProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  companyName: z.string().max(160),
  categories: z.array(z.nativeEnum(ServiceCategory)),
  description: z.string().max(2000).nullable(),
  pricingModel: z.string().max(80).nullable(),
  yearsExperience: z.number().int().nonnegative().nullable(),
  clientsServed: z.number().int().nonnegative().nullable(),
  website: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ServiceProviderProfileRecord = z.infer<typeof serviceProviderProfileSchema>;

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const createServiceProviderInputSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(160),
  categories: z.array(z.nativeEnum(ServiceCategory)).min(1, "Select at least one service category"),
  description: z.string().max(2000).optional(),
  pricingModel: z.string().min(1, "Pricing model is required").max(80),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  clientsServed: z.coerce.number().int().nonnegative(),
  website: urlOrEmpty,
});
export type CreateServiceProviderInput = z.infer<typeof createServiceProviderInputSchema>;

/** Service-provider directory filters — same shape family as investorSearchFiltersSchema. */
export const serviceProviderSearchFiltersSchema = z.object({
  categories: z.array(z.nativeEnum(ServiceCategory)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ServiceProviderSearchFilters = z.infer<typeof serviceProviderSearchFiltersSchema>;
