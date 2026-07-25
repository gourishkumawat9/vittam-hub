import { z } from "zod";

import { ClaimableEntityType, ClaimStatus, RelationshipType } from "./enums";

/**
 * A claim about a relationship between two entities, confirmed or denied by
 * the OTHER party — spec §9. "Startup claims an investor -> the investor
 * confirms", "Incubator claims an alumnus -> the startup confirms", etc.
 * Unconfirmed claims count for zero trust; only CONFIRMED ones feed a
 * VerificationRecord for both sides. See RelationshipClaimsService.
 */
export const relationshipClaimSchema = z.object({
  id: z.string().uuid(),
  claimantType: z.nativeEnum(ClaimableEntityType),
  claimantId: z.string().uuid(),
  targetType: z.nativeEnum(ClaimableEntityType),
  targetId: z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType),
  status: z.nativeEnum(ClaimStatus),
  note: z.string().max(1000).nullable(),
  evidenceUrl: z.string().url().nullable(),
  respondedBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  respondedAt: z.string().datetime().nullable(),
});
export type RelationshipClaim = z.infer<typeof relationshipClaimSchema>;

export const createRelationshipClaimInputSchema = z.object({
  targetType: z.nativeEnum(ClaimableEntityType),
  targetId: z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType),
  note: z.string().max(1000).optional(),
  evidenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
});
export type CreateRelationshipClaimInput = z.infer<typeof createRelationshipClaimInputSchema>;

export const respondToRelationshipClaimActionSchema = z.enum(["CONFIRM", "DENY"]);
export type RespondToRelationshipClaimAction = z.infer<typeof respondToRelationshipClaimActionSchema>;

export const respondToRelationshipClaimInputSchema = z.object({
  action: respondToRelationshipClaimActionSchema,
});
export type RespondToRelationshipClaimInput = z.infer<typeof respondToRelationshipClaimInputSchema>;

export const relationshipClaimListFiltersSchema = z.object({
  status: z.array(z.nativeEnum(ClaimStatus)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type RelationshipClaimListFilters = z.infer<typeof relationshipClaimListFiltersSchema>;
