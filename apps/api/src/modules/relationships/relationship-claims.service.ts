import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type {
  ClaimableEntityType,
  CreateRelationshipClaimInput,
  RelationshipClaimListFilters,
  RespondToRelationshipClaimAction,
  UserRole,
} from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

const RELATIONSHIP_CLAIM_VERIFICATION_TTL_DAYS = 730; // "verification always expires" (spec §2) — 2yr forces periodic reconfirmation

/** Which entity type a user's role lets them file/receive claims as. Only roles with a claimable profile are eligible. */
const ROLE_TO_CLAIMANT_TYPE: Partial<Record<UserRole, ClaimableEntityType>> = {
  FOUNDER: "Startup",
  INVESTOR: "Investor",
  INCUBATOR: "IncubatorProfile",
  UNIVERSITY: "UniversityProfile",
};

const RESPONSE_ACTION_TO_STATUS: Record<RespondToRelationshipClaimAction, "CONFIRMED" | "DENIED"> = {
  CONFIRM: "CONFIRMED",
  DENY: "DENIED",
};

/**
 * Two-sided confirmation (spec §9) — the free, unfakeable mechanism that
 * grows the trust graph as a by-product: any claim about a relationship
 * ("we invested in this startup", "this startup is our alumnus") only counts
 * once the OTHER party confirms it. An unconfirmed claim is worth zero trust;
 * a CONFIRMED one becomes a V2 VerificationRecord on *both* sides.
 */
@Injectable()
export class RelationshipClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Resolves {entityId, ownerId} for a claimable entity — the one place that knows how to reach across the four profile tables. */
  private async resolveEntity(entityType: ClaimableEntityType, entityId: string): Promise<{ id: string; ownerId: string } | null> {
    switch (entityType) {
      case "Startup":
        return this.prisma.startup.findUnique({ where: { id: entityId }, select: { id: true, ownerId: true } });
      case "Investor":
        return this.prisma.investor.findUnique({ where: { id: entityId }, select: { id: true, ownerId: true } });
      case "IncubatorProfile":
        return this.prisma.incubatorProfile.findUnique({ where: { id: entityId }, select: { id: true, ownerId: true } });
      case "UniversityProfile":
        return this.prisma.universityProfile.findUnique({ where: { id: entityId }, select: { id: true, ownerId: true } });
      default:
        return null;
    }
  }

  private async resolveOwnEntity(userId: string, entityType: ClaimableEntityType): Promise<{ id: string; ownerId: string } | null> {
    switch (entityType) {
      case "Startup":
        return this.prisma.startup.findUnique({ where: { ownerId: userId }, select: { id: true, ownerId: true } });
      case "Investor":
        return this.prisma.investor.findUnique({ where: { ownerId: userId }, select: { id: true, ownerId: true } });
      case "IncubatorProfile":
        return this.prisma.incubatorProfile.findUnique({ where: { ownerId: userId }, select: { id: true, ownerId: true } });
      case "UniversityProfile":
        return this.prisma.universityProfile.findUnique({ where: { ownerId: userId }, select: { id: true, ownerId: true } });
      default:
        return null;
    }
  }

  async create(callerId: string, callerRole: UserRole, input: CreateRelationshipClaimInput) {
    const claimantType = ROLE_TO_CLAIMANT_TYPE[callerRole];
    if (!claimantType) {
      throw new ForbiddenException("Your account type can't file relationship claims");
    }

    const claimant = await this.resolveOwnEntity(callerId, claimantType);
    if (!claimant) {
      throw new BadRequestException("Complete your profile before claiming a relationship");
    }

    const target = await this.resolveEntity(input.targetType, input.targetId);
    if (!target) throw new NotFoundException("Target profile not found");
    if (claimantType === input.targetType && claimant.id === target.id) {
      throw new BadRequestException("A profile can't claim a relationship with itself");
    }

    const claim = await this.prisma.relationshipClaim.create({
      data: {
        claimantType,
        claimantId: claimant.id,
        targetType: input.targetType,
        targetId: target.id,
        relationshipType: input.relationshipType,
        note: input.note,
        evidenceUrl: input.evidenceUrl || undefined,
      },
    });

    this.eventEmitter.emit("relationship-claim.created", {
      targetOwnerId: target.ownerId,
      claimantType,
      relationshipType: input.relationshipType,
    });
    await this.auditLog.record({
      actorId: callerId,
      action: "relationship_claim.created",
      entityType: "RelationshipClaim",
      entityId: claim.id,
    });

    return claim;
  }

  async respond(claimId: string, callerId: string, action: RespondToRelationshipClaimAction) {
    const claim = await this.prisma.relationshipClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException("Relationship claim not found");
    if (claim.status !== "PENDING") throw new BadRequestException("This claim has already been responded to");

    const target = await this.resolveEntity(claim.targetType as ClaimableEntityType, claim.targetId);
    if (!target || target.ownerId !== callerId) {
      throw new ForbiddenException("Only the claimed-about party can confirm or deny this");
    }

    const status = RESPONSE_ACTION_TO_STATUS[action];
    const updated = await this.prisma.relationshipClaim.update({
      where: { id: claimId },
      data: { status, respondedAt: new Date(), respondedBy: callerId },
    });

    if (status === "CONFIRMED") {
      await this.recordTwoSidedVerification(claim.claimantType, claim.claimantId, claim.targetType, claim.targetId, claim.relationshipType);
    }

    const claimant = await this.resolveEntity(claim.claimantType as ClaimableEntityType, claim.claimantId);
    if (claimant) {
      this.eventEmitter.emit(status === "CONFIRMED" ? "relationship-claim.confirmed" : "relationship-claim.denied", {
        claimantOwnerId: claimant.ownerId,
        relationshipType: claim.relationshipType,
      });
    }

    await this.auditLog.record({
      actorId: callerId,
      action: `relationship_claim.${status.toLowerCase()}`,
      entityType: "RelationshipClaim",
      entityId: claimId,
    });

    return updated;
  }

  /** A CONFIRMED claim becomes a V2 VerificationRecord for BOTH sides — free, unfakeable, per spec §9. */
  private async recordTwoSidedVerification(
    claimantType: string,
    claimantId: string,
    targetType: string,
    targetId: string,
    relationshipType: string,
  ) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RELATIONSHIP_CLAIM_VERIFICATION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const rows: Prisma.VerificationRecordCreateManyInput[] = [
      {
        entityType: claimantType,
        entityId: claimantId,
        field: `relationship:${relationshipType}:${targetType}:${targetId}`,
        tier: "V2",
        method: "TWO_SIDED_CONFIRMATION",
        status: "VERIFIED",
        verifiedAt: now,
        expiresAt,
        verifiedBy: "system:relationship-claims",
      },
      {
        entityType: targetType,
        entityId: targetId,
        field: `relationship:${relationshipType}:${claimantType}:${claimantId}`,
        tier: "V2",
        method: "TWO_SIDED_CONFIRMATION",
        status: "VERIFIED",
        verifiedAt: now,
        expiresAt,
        verifiedBy: "system:relationship-claims",
      },
    ];
    await this.prisma.verificationRecord.createMany({ data: rows });
  }

  async listForEntity(entityType: ClaimableEntityType, entityId: string, filters: RelationshipClaimListFilters) {
    const where: Prisma.RelationshipClaimWhereInput = {
      OR: [
        { claimantType: entityType, claimantId: entityId },
        { targetType: entityType, targetId: entityId },
      ],
      ...(filters.status?.length ? { status: { in: filters.status } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.relationshipClaim.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.relationshipClaim.count({ where }),
    ]);
    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  /** The caller's own claims, sent and received, resolved from their role's profile — the natural "My relationship claims" view. */
  async listMine(callerId: string, callerRole: UserRole, filters: RelationshipClaimListFilters) {
    const claimantType = ROLE_TO_CLAIMANT_TYPE[callerRole];
    if (!claimantType) return buildPaginatedResult([], 0, filters.page, filters.pageSize);

    const own = await this.resolveOwnEntity(callerId, claimantType);
    if (!own) return buildPaginatedResult([], 0, filters.page, filters.pageSize);

    return this.listForEntity(claimantType, own.id, filters);
  }
}
