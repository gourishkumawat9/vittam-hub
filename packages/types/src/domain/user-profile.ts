import { z } from "zod";

import { optionalDateOfBirthSchema } from "./dates";
import { Gender, MemberPersona, OnboardingStatus } from "./enums";
import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

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
  linkedinUrl: httpUrlSchema.nullable(),
  githubUrl: httpUrlSchema.nullable(),
  portfolioUrl: httpUrlSchema.nullable(),
  city: z.string().max(80).nullable(),
  state: z.string().max(80).nullable(),
  country: z.string().max(80).nullable(),
  bio: z.string().max(1000).nullable(),
  yearsOfExperience: z.number().int().nonnegative().nullable(),
  persona: z.nativeEnum(MemberPersona).nullable(),
  designation: z.string().max(120).nullable(),
  studentInstitution: z.string().max(160).nullable(),
  studentCourse: z.string().max(120).nullable(),
  graduationYear: z.number().int().nullable(),
  bhaskarId: z.string().max(40).nullable(),
  onboardingStatus: z.nativeEnum(OnboardingStatus),
  onboardingStep: z.number().int().min(0),
});
export type UserProfileRecord = z.infer<typeof userProfileSchema>;

const urlOrEmpty = optionalHttpUrlSchema;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const optionalYear = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number()
    .int()
    .min(1950, "Enter a year from 1950")
    .max(new Date().getFullYear() + 8, "That year is too far ahead")
    .optional(),
);

/**
 * Only a name, a mobile number and a city are asked for at sign-up (the
 * owner's call, November 2026: ask for the important things first, the way
 * BHASKAR does). Everything else is optional and can be added later.
 *
 * Students also name their college (checked by the founder publisher, which
 * knows the persona). `designation` is the person's role at the organisation
 * they sign up for; the organisation steps ask for it.
 */
export const personalDetailsInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120),
  avatarUrl: urlOrEmpty,
  mobileNumber: z.string().min(6, "Enter a valid mobile number").max(20),
  dateOfBirth: optionalDateOfBirthSchema,
  gender: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.nativeEnum(Gender).optional()),
  nationality: optionalText(80),
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  city: z.string().min(1, "City is required").max(80),
  state: optionalText(80),
  country: optionalText(80),
  bio: z.string().max(1000).optional(),
  yearsOfExperience: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().max(80).optional(),
  ),
  studentInstitution: optionalText(160),
  studentCourse: optionalText(120),
  graduationYear: optionalYear,
  // BHASKAR IDs look like "BHA" + digits today; kept loose so a format change there doesn't lock people out.
  bhaskarId: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Letters and numbers only")
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
});
export type PersonalDetailsInput = z.infer<typeof personalDetailsInputSchema>;
