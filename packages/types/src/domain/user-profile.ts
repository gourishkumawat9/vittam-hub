import { z } from "zod";

import { Gender, OnboardingStatus } from "./enums";

/**
 * "Personal Details" — the one form every role's onboarding starts with
 * (Founder wizard Step 1; Step 1-equivalent for every other role) before
 * branching into role-specific fields. See packages/types/src/domain/enums.ts
 * header comment: keep in sync with the Prisma `UserProfile` model.
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  mobileNumber: z.string().max(20).nullable(),
  dateOfBirth: z.string().datetime().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  nationality: z.string().max(80).nullable(),
  linkedinUrl: z.string().url().nullable(),
  githubUrl: z.string().url().nullable(),
  portfolioUrl: z.string().url().nullable(),
  city: z.string().max(80).nullable(),
  state: z.string().max(80).nullable(),
  country: z.string().max(80).nullable(),
  bio: z.string().max(1000).nullable(),
  yearsOfExperience: z.number().int().nonnegative().nullable(),
  onboardingStatus: z.nativeEnum(OnboardingStatus),
  onboardingStep: z.number().int().min(0),
});
export type UserProfileRecord = z.infer<typeof userProfileSchema>;

const urlOrEmpty = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const personalDetailsInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120),
  avatarUrl: urlOrEmpty,
  mobileNumber: z.string().min(6, "Enter a valid mobile number").max(20),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.nativeEnum(Gender),
  nationality: z.string().min(1, "Nationality is required").max(80),
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  city: z.string().min(1, "City is required").max(80),
  state: z.string().min(1, "State is required").max(80),
  country: z.string().min(1, "Country is required").max(80),
  bio: z.string().max(1000).optional(),
  yearsOfExperience: z.coerce.number().int().nonnegative().optional(),
});
export type PersonalDetailsInput = z.infer<typeof personalDetailsInputSchema>;
