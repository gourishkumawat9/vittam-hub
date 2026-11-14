import { z } from "zod";

import { UserRole, VerificationStatus } from "./enums";
import { httpUrlSchema } from "./url";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  avatarUrl: httpUrlSchema.nullable(),
  role: z.nativeEnum(UserRole),
  verificationStatus: z.nativeEnum(VerificationStatus),
  emailVerifiedAt: z.string().datetime().nullable(),
  twoFactorEnabled: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

/**
 * ADMIN is provisioned internally, never self-registered through the public signup flow.
 * SERVICE_PROVIDER and JOB_SEEKER stay in UserRole (existing rows, schema) but sign-up for
 * them is paused until after the growth stage — see CLAUDE.md "Current scope".
 */
export const REGISTERABLE_ROLES = [UserRole.FOUNDER, UserRole.INVESTOR, UserRole.MENTOR, UserRole.INCUBATOR, UserRole.UNIVERSITY] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

/**
 * An email address someone signs in with. Trimmed and lower-cased before it is
 * checked, so "Asha@Example.com " and "asha@example.com" are one account:
 * compared exactly, a capital letter at sign-in read as "invalid email or
 * password" and the same person could end up with two accounts.
 */
export const accountEmailSchema = z.string().trim().toLowerCase().max(254, "That email address is too long").email("Enter a valid email address");

/**
 * Mirrors a standard enterprise password policy (min length + character
 * variety) — the same schema backs both the client-side strength meter and
 * the server's final check, so they can never disagree.
 */
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const registerInputSchema = z.object({
  email: accountEmailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(1, "Enter your name").max(120),
  role: z.enum(REGISTERABLE_ROLES),
  // Required only when CAPTCHA_SECRET_KEY is configured server-side (see
  // apps/api/src/config/env.validation.ts) — optional here so the schema
  // doesn't hard-block auth in environments that haven't set up Turnstile yet.
  captchaToken: z.string().max(4096).optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: accountEmailSchema,
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean().default(false),
  captchaToken: z.string().max(4096).optional(),
});
export type LoginInput = z.infer<typeof loginInputSchema>;
