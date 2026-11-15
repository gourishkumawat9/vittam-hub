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

const WORK_EMAIL_METHOD = "DOMAIN_EMAIL_HEURISTIC";
const WORK_EMAIL_FIELD = "workEmail";
/** Ledger fields only the platform's own checks may write. */
const SYSTEM_FIELDS = new Set(["overall", "phone", WORK_EMAIL_FIELD]);

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
    const provider = this.registry.get(method);
    if (!provider) throw new BadRequestException(`Unknown verification method "${method}"`);

    // The work-email check is about the account's own, confirmed address and
    // nothing else. It used to run on whatever address the caller typed, so
    // anyone could post "partner@a-well-known-fund.com" and receive a verified
    // work-email record on their own profile.
    if (method === WORK_EMAIL_METHOD) {
      const record = await this.ensureWorkEmailRecord(callerId);
      if (!record) throw new BadRequestException("Confirm your email address first, then try again");
      return record;
    }

    const ownerId = await this.resolveOwnerId(entityType, entityId);
    if (!ownerId) throw new NotFoundException("Profile not found");
    if (ownerId !== callerId) throw new ForbiddenException("You can only request verification for your own profile");

    // These are written by the platform itself (overall status, the phone
    // code, the work-email check). A caller naming one of them would be
    // writing a row that reads as the platform's own finding.
    if (SYSTEM_FIELDS.has(field)) {
      throw new BadRequestException(`"${field}" can't be checked this way`);
    }

    const result = await provider.verify(input);
    const data = {
      tier: result.tier,
      status: result.status,
      verifiedAt: result.status === "VERIFIED" ? new Date() : null,
      expiresAt: result.expiresAt ?? null,
      verifiedBy: `provider:${method}`,
      rawResponse: result.rawResponse as Prisma.InputJsonValue,
    };

    // One open row per check, refreshed in place. Every provider but the
    // work-email one answers PENDING until its registry key is configured, so
    // creating a row per request let one account add rows without end.
    const open = await this.prisma.verificationRecord.findFirst({
      where: { entityType, entityId, field, method, status: { in: ["PENDING", "FAILED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (open) return this.prisma.verificationRecord.update({ where: { id: open.id }, data });

    return this.prisma.verificationRecord.create({ data: { entityType, entityId, field, method, ...data } });
  }

  /**
   * The one automated check that runs itself: work-domain email costs nothing
   * and needs no config, so every profile write gets it for free instead of
   * waiting on the owner to hit the checks endpoint. It also runs the moment
   * an address is confirmed.
   */
  @OnEvent("profile.upserted")
  @OnEvent("user.email-verified")
  async runWorkDomainEmailCheck(payload: { ownerId: string }) {
    await this.ensureWorkEmailRecord(payload.ownerId);
  }

  /**
   * Returns the account's work-email record, creating it on first use. Null
   * while the address is unconfirmed: until the emailed code comes back,
   * nothing shows the person owns the address they signed up with, so its
   * domain says nothing about where they work. Skipped once a record exists,
   * as an email rarely changes and this keeps the ledger from growing a row
   * on every autosave-triggered profile write.
   */
  private async ensureWorkEmailRecord(userId: string) {
    const existing = await this.prisma.verificationRecord.findFirst({
      where: { entityType: "User", entityId: userId, field: WORK_EMAIL_FIELD },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true, deletedAt: true },
    });
    if (!user || user.deletedAt || !user.emailVerifiedAt) return null;

    const provider = this.registry.get(WORK_EMAIL_METHOD);
    if (!provider) return null;
    const result = await provider.verify({ email: user.email });

    return this.prisma.verificationRecord.create({
      data: {
        entityType: "User",
        entityId: userId,
        field: WORK_EMAIL_FIELD,
        tier: result.tier,
        method: WORK_EMAIL_METHOD,
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
