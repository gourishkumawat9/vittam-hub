import { z } from "zod";

import { UserRole, VerificationStatus } from "./enums";

/**
 * Read-only verification-status snapshot across every profile type — there is
 * no approve/reject input schema here because there's no manual verification
 * action anywhere in the product (CLAUDE.md §6). Status is fully automated by
 * VerificationEngineService; this is what the admin panel's observability
 * section reads.
 */
const statusCountSchema = z.object({
  status: z.nativeEnum(VerificationStatus),
  count: z.number().int().nonnegative(),
});

const pendingStartupSchema = z.object({ id: z.string().uuid(), name: z.string(), createdAt: z.string().datetime() });
const pendingInvestorSchema = z.object({ id: z.string().uuid(), firmName: z.string().nullable(), createdAt: z.string().datetime() });
const pendingMentorSchema = z.object({ id: z.string().uuid(), headline: z.string().nullable(), createdAt: z.string().datetime() });
const pendingIncubatorSchema = z.object({ id: z.string().uuid(), organizationName: z.string(), createdAt: z.string().datetime() });

export const verificationOverviewSchema = z.object({
  counts: z.object({
    startup: z.array(statusCountSchema),
    investor: z.array(statusCountSchema),
    mentorProfile: z.array(statusCountSchema),
    incubatorProfile: z.array(statusCountSchema),
  }),
  pending: z.object({
    startup: z.array(pendingStartupSchema),
    investor: z.array(pendingInvestorSchema),
    mentorProfile: z.array(pendingMentorSchema),
    incubatorProfile: z.array(pendingIncubatorSchema),
  }),
});
export type VerificationOverview = z.infer<typeof verificationOverviewSchema>;

/** Platform-wide, read-only — no PII beyond what the verification-overview lists already expose. */
export const platformTotalsSchema = z.object({
  users: z.number().int().nonnegative(),
  startups: z.number().int().nonnegative(),
  investors: z.number().int().nonnegative(),
  connections: z.number().int().nonnegative(),
});
export type PlatformTotals = z.infer<typeof platformTotalsSchema>;

export const signupsFiltersSchema = z.object({
  bucket: z.enum(["week", "month"]).default("week"),
  limit: z.coerce.number().int().min(1).max(52).default(12),
});
export type SignupsFilters = z.infer<typeof signupsFiltersSchema>;

export const signupBucketSchema = z.object({
  bucket: z.string(),
  count: z.number().int().nonnegative(),
});
export type SignupBucket = z.infer<typeof signupBucketSchema>;

export const connectionAcceptanceRateSchema = z.object({
  rate: z.number().min(0).max(1).nullable(),
  accepted: z.number().int().nonnegative(),
  declined: z.number().int().nonnegative(),
});
export type ConnectionAcceptanceRate = z.infer<typeof connectionAcceptanceRateSchema>;

export const verificationFunnelStageSchema = z.object({
  stage: z.nativeEnum(VerificationStatus),
  count: z.number().int().nonnegative(),
});
export type VerificationFunnelStage = z.infer<typeof verificationFunnelStageSchema>;

/** Read-only list/search — no ban/edit/role-change action anywhere (CLAUDE.md §6: no manual gatekeeping). */
export const adminUserListFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  role: z.array(z.nativeEnum(UserRole)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminUserListFilters = z.infer<typeof adminUserListFiltersSchema>;

export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.nativeEnum(UserRole),
  verificationStatus: z.nativeEnum(VerificationStatus),
  createdAt: z.string().datetime(),
});
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;
