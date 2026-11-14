import { z } from "zod";

/** Mirrors VerificationOrchestratorService's VerifiableEntityType — the 6 profile types plus the user record itself. */
export const verifiableEntityTypeSchema = z.enum([
  "User",
  "Startup",
  "Investor",
  "MentorProfile",
  "IncubatorProfile",
  "UniversityProfile",
  "ServiceProviderProfile",
]);
export type VerifiableEntityType = z.infer<typeof verifiableEntityTypeSchema>;

/**
 * Triggers one registered VerificationProvider (see
 * apps/api/src/modules/verification/providers/) against the caller's own
 * profile. `method` isn't a closed enum here — the provider registry is the
 * source of truth and rejects unknown methods at the service layer.
 */
export const runVerificationCheckInputSchema = z.object({
  entityType: verifiableEntityTypeSchema,
  entityId: z.string().uuid(),
  field: z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/, "Use letters, numbers, dots, dashes and underscores"),
  method: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/, "Unknown verification method"),
  // A handful of short identifiers (a CIN, a GSTIN, a registration number). It is stored with the result, so it is kept small.
  input: z
    .record(z.string().max(64), z.string().max(500))
    .default({})
    .refine((value) => Object.keys(value).length <= 10, { message: "Too many fields" }),
});
export type RunVerificationCheckInput = z.infer<typeof runVerificationCheckInputSchema>;

export const verificationRecordSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  field: z.string(),
  tier: z.enum(["V0", "V1", "V2", "V3"]),
  method: z.string(),
  status: z.enum(["PENDING", "VERIFIED", "FAILED", "EXPIRED", "DISPUTED"]),
  verifiedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  verifiedBy: z.string().nullable(),
  confidence: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VerificationRecordDto = z.infer<typeof verificationRecordSchema>;
