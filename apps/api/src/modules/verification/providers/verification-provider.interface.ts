import type { VerificationTier } from "@prisma/client";

export interface VerificationProviderResult {
  status: "VERIFIED" | "FAILED" | "PENDING";
  tier: VerificationTier;
  rawResponse: unknown; // retained permanently on the VerificationRecord row, per spec §2
  expiresAt?: Date;
}

/**
 * One pluggable integration behind a common shape — CLAUDE.md §8 ("keep
 * integrations behind clean service boundaries... optional/pluggable, degrade
 * gracefully when unconfigured"), same pattern as CaptchaService/EmailService.
 * `method` must match the value written to VerificationRecord.method.
 */
export interface VerificationProvider {
  readonly method: string;
  verify(input: Record<string, string>): Promise<VerificationProviderResult>;
}
