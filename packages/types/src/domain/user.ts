import { z } from "zod";

import { UserRole, VerificationStatus } from "./enums";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  avatarUrl: z.string().url().nullable(),
  role: z.nativeEnum(UserRole),
  verificationStatus: z.nativeEnum(VerificationStatus),
  emailVerifiedAt: z.string().datetime().nullable(),
  twoFactorEnabled: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

/** ADMIN is provisioned internally, never self-registered through the public signup flow. */
export const REGISTERABLE_ROLES = [
  UserRole.FOUNDER,
  UserRole.INVESTOR,
  UserRole.MENTOR,
  UserRole.INCUBATOR,
  UserRole.UNIVERSITY,
  UserRole.SERVICE_PROVIDER,
  UserRole.JOB_SEEKER,
] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

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
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().min(1).max(120),
  role: z.enum(REGISTERABLE_ROLES),
  // Required only when CAPTCHA_SECRET_KEY is configured server-side (see
  // apps/api/src/config/env.validation.ts) — optional here so the schema
  // doesn't hard-block auth in environments that haven't set up Turnstile yet.
  captchaToken: z.string().optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
  captchaToken: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginInputSchema>;
