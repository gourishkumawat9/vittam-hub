import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

import { VerificationProviderRegistry } from "./providers/verification-provider.registry";

export type VerifiableEntityType =
  | "User"
  | "Startup"
  | "Investor"
  | "MentorProfile"
  | "IncubatorProfile"
  | "UniversityProfile"
  | "ServiceProviderProfile";

/** Runs one registered VerificationProvider by method name and writes the resulting VerificationRecord row — the write side of the ledger VerificationEngineService reads from. */
@Injectable()
export class VerificationOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: VerificationProviderRegistry,
  ) {}

  /** Resolves the owning userId for any of the six profile types (or the user itself), so a caller can only ever run checks against their own profile. */
  private async resolveOwnerId(entityType: VerifiableEntityType, entityId: string): Promise<string | null> {
    switch (entityType) {
      case "User":
        return entityId;
      case "Startup":
        return (await this.prisma.startup.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null;
      case "Investor":
        return (await this.prisma.investor.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null;
      case "MentorProfile":
        return (await this.prisma.mentorProfile.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null;
      case "IncubatorProfile":
        return (await this.prisma.incubatorProfile.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null;
      case "UniversityProfile":
        return (await this.prisma.universityProfile.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null;
      case "ServiceProviderProfile":
        return (
          (await this.prisma.serviceProviderProfile.findUnique({ where: { id: entityId }, select: { ownerId: true } }))?.ownerId ?? null
        );
      default:
        return null;
    }
  }

  async runCheck(
    callerId: string,
    entityType: VerifiableEntityType,
    entityId: string,
    field: string,
    method: string,
    input: Record<string, string>,
  ) {
    const ownerId = await this.resolveOwnerId(entityType, entityId);
    if (!ownerId) throw new NotFoundException("Profile not found");
    if (ownerId !== callerId) throw new ForbiddenException("You can only request verification for your own profile");

    const provider = this.registry.get(method);
    if (!provider) throw new BadRequestException(`Unknown verification method "${method}"`);

    const result = await provider.verify(input);

    return this.prisma.verificationRecord.create({
      data: {
        entityType,
        entityId,
        field,
        tier: result.tier,
        method,
        status: result.status,
        verifiedAt: result.status === "VERIFIED" ? new Date() : null,
        expiresAt: result.expiresAt ?? null,
        verifiedBy: `provider:${method}`,
        rawResponse: result.rawResponse as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * The one automated check that runs itself: work-domain email costs nothing
   * and needs no config, so every profile write gets it for free instead of
   * waiting on the owner to hit the checks endpoint. Skipped once a record
   * already exists for this user — an email rarely changes, and this keeps
   * the ledger from growing a row on every autosave-triggered profile write.
   */
  @OnEvent("profile.upserted")
  async runWorkDomainEmailCheck(payload: { ownerId: string }) {
    const existing = await this.prisma.verificationRecord.findFirst({
      where: { entityType: "User", entityId: payload.ownerId, field: "workEmail" },
    });
    if (existing) return;

    const user = await this.prisma.user.findUnique({ where: { id: payload.ownerId }, select: { email: true } });
    if (!user) return;

    const provider = this.registry.get("DOMAIN_EMAIL_HEURISTIC");
    if (!provider) return;
    const result = await provider.verify({ email: user.email });

    await this.prisma.verificationRecord.create({
      data: {
        entityType: "User",
        entityId: payload.ownerId,
        field: "workEmail",
        tier: result.tier,
        method: "DOMAIN_EMAIL_HEURISTIC",
        status: result.status,
        verifiedAt: result.status === "VERIFIED" ? new Date() : null,
        expiresAt: result.expiresAt ?? null,
        verifiedBy: "system:auto-check",
        rawResponse: result.rawResponse as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * The ledger legitimately backs the public verification badges on a
   * profile, so it stays readable by anyone — but only the owner sees the
   * full rows. `rawResponse` holds the verbatim payload returned by the
   * government/registry providers (MCA, GSTIN, SEBI, DigiLocker, ICAI...),
   * i.e. identity PII, and `verifiedBy`/`input` can expose internal detail.
   * Non-owners get just the badge-shaped facts.
   */
  async getRecords(entityType: VerifiableEntityType, entityId: string, callerId: string) {
    const records = await this.prisma.verificationRecord.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });

    const ownerId = await this.resolveOwnerId(entityType, entityId);
    if (ownerId && ownerId === callerId) return records;

    return records.map((record) => ({
      id: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
      field: record.field,
      tier: record.tier,
      method: record.method,
      status: record.status,
      verifiedAt: record.verifiedAt,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    }));
  }
}
