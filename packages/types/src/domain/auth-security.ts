import { z } from "zod";

import { accountEmailSchema, passwordSchema } from "./user";

// ─── Email verification (OTP) ─────────────────────────────────────────────

export const requestOtpInputSchema = z.object({
  email: accountEmailSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpInputSchema>;

export const verifyOtpInputSchema = z.object({
  email: accountEmailSchema,
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpInputSchema>;

// ─── MFA (TOTP) ────────────────────────────────────────────────────────────

export const mfaEnrollResponseSchema = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
  qrCodeDataUrl: z.string(),
});
export type MfaEnrollResponse = z.infer<typeof mfaEnrollResponseSchema>;

export const mfaVerifyInputSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code from your authenticator app"),
});
export type MfaVerifyInput = z.infer<typeof mfaVerifyInputSchema>;

export const mfaRecoveryCodesResponseSchema = z.object({
  codes: z.array(z.string()),
});
export type MfaRecoveryCodesResponse = z.infer<typeof mfaRecoveryCodesResponseSchema>;

export const mfaChallengeInputSchema = z.object({
  challengeToken: z.string().min(1).max(2048),
  code: z.string().min(6).max(10), // 6-digit TOTP or an 8-char recovery code
});
export type MfaChallengeInput = z.infer<typeof mfaChallengeInputSchema>;

// ─── Password reset ─────────────────────────────────────────────────────────

export const requestPasswordResetInputSchema = z.object({
  email: accountEmailSchema,
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

export const confirmPasswordResetInputSchema = z.object({
  token: z.string().min(1).max(256),
  password: passwordSchema,
});
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

/**
 * Deleting an account can't be undone, so an account that has a password must
 * give it again. An account that only ever signed in with Google, GitHub or
 * LinkedIn has no password to give.
 */
export const deleteAccountInputSchema = z.object({
  password: z.string().max(128).optional(),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

// ─── Sessions / devices ─────────────────────────────────────────────────────

export const sessionSchema = z.object({
  id: z.string().uuid(),
  deviceLabel: z.string().nullable(),
  ipAddress: z.string().nullable(),
  lastUsedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  isCurrent: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;
