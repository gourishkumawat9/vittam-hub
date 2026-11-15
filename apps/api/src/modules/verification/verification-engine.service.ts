import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import type { DocumentType } from "@prisma/client";
import type { VerificationStatus } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { ProfileCompletionService } from "../startups/profile-completion.service";

/** One thing a profile needs for the Verified badge, and whether it has it. */
export interface VerificationRequirement {
  key: string;
  label: string;
  met: boolean;
  /** Set when the requirement is met by uploading a document of this type. */
  documentType?: DocumentType;
}

export interface VerificationProgress {
  entityType: string;
  status: VerificationStatus;
  requirements: VerificationRequirement[];
}

interface ProfileRequirements {
  entityType: string;
  entityId: string;
  current: VerificationStatus;
  requirements: VerificationRequirement[];
}

/**
 * Derives `verificationStatus` for every profile type from signals already
 * collected during onboarding — no human ever approves/rejects a profile
 * here (see CLAUDE.md §6). `REJECTED` is never set by this engine; it's
 * reserved for a future automated fraud/mismatch signal and, once set, is
 * left alone by every recompute below.
 *
 * Triggered by a `profile.upserted` event emitted after any write that could
 * change a signal (document upload/removal, profile create/update) — see
 * DocumentsService/StartupsService/InvestorsService/{Mentor,Incubator}Publisher.
 */
@Injectable()
export class VerificationEngineService {
  private readonly logger = new Logger(VerificationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileCompletion: ProfileCompletionService,
    private readonly auditLog: AuditLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent("profile.upserted")
  async recomputeForOwner(payload: { ownerId: string }) {
    await Promise.all([
      this.recomputeStartup(payload.ownerId),
      this.recomputeInvestor(payload.ownerId),
      this.recomputeMentor(payload.ownerId),
      this.recomputeIncubator(payload.ownerId),
      this.recomputeUniversity(payload.ownerId),
    ]);
  }

  /**
   * What the caller's own profile still needs for the Verified badge: the same
   * list the engine decides the status from, so the screen that shows it can
   * never disagree with the badge. Null when the account has no profile yet.
   */
  async requirementsFor(ownerId: string): Promise<VerificationProgress | null> {
    const found =
      (await this.startupRequirements(ownerId)) ??
      (await this.investorRequirements(ownerId)) ??
      (await this.mentorRequirements(ownerId)) ??
      (await this.incubatorRequirements(ownerId)) ??
      (await this.universityRequirements(ownerId));
    if (!found) return null;
    // Worked out from the list itself, not read from the stored column: the
    // column is updated a moment after an upload, and the screen must not show
    // a ticked list beside a stale "not verified".
    const status = found.current === "REJECTED" ? "REJECTED" : this.deriveStatus(found.requirements);
    return { entityType: found.entityType, status, requirements: found.requirements };
  }

  /** Never returns REJECTED — every caller already guards `verificationStatus === "REJECTED"` before reaching here. */
  private deriveStatus(requirements: VerificationRequirement[]): Exclude<VerificationStatus, "REJECTED"> {
    const metCount = requirements.filter((requirement) => requirement.met).length;
    if (metCount === requirements.length) return "VERIFIED";
    if (metCount === 0) return "UNVERIFIED";
    return "PENDING";
  }

  private hasDocument(ownerId: string, type: DocumentType): Promise<boolean> {
    return this.prisma.document.findFirst({ where: { userId: ownerId, type }, select: { id: true } }).then(Boolean);
  }

  private async startupRequirements(ownerId: string): Promise<ProfileRequirements | null> {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId } });
    if (!startup) return null;
    const [incorporationDoc, pitchDeckDoc, completion] = await Promise.all([
      this.hasDocument(ownerId, "INCORPORATION_CERTIFICATE"),
      this.hasDocument(ownerId, "PITCH_DECK"),
      this.profileCompletion.calculate(startup.id),
    ]);
    return {
      entityType: "Startup",
      entityId: startup.id,
      current: startup.verificationStatus,
      requirements: [
        {
          key: "registration",
          label: "Company registered, or certificate of incorporation uploaded",
          met: startup.registrationStatus === "REGISTERED" || incorporationDoc,
          documentType: "INCORPORATION_CERTIFICATE",
        },
        { key: "pitchDeck", label: "Pitch deck uploaded", met: pitchDeckDoc, documentType: "PITCH_DECK" },
        { key: "profile", label: "Profile at least 80% complete", met: completion.percent >= 80 },
      ],
    };
  }

  private async investorRequirements(ownerId: string): Promise<ProfileRequirements | null> {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId } });
    if (!investor) return null;
    return {
      entityType: "Investor",
      entityId: investor.id,
      current: investor.verificationStatus,
      requirements: [
        { key: "identity", label: "Government ID uploaded", met: await this.hasDocument(ownerId, "GOVERNMENT_ID"), documentType: "GOVERNMENT_ID" },
        {
          key: "profile",
          label: "Bio, preferred industries and preferred stages filled in",
          met: investor.bio.trim().length > 0 && investor.preferredIndustries.length > 0 && investor.preferredStages.length > 0,
        },
      ],
    };
  }

  private async mentorRequirements(ownerId: string): Promise<ProfileRequirements | null> {
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { ownerId } });
    if (!mentor) return null;
    return {
      entityType: "MentorProfile",
      entityId: mentor.id,
      current: mentor.verificationStatus,
      requirements: [
        { key: "identity", label: "Government ID uploaded", met: await this.hasDocument(ownerId, "GOVERNMENT_ID"), documentType: "GOVERNMENT_ID" },
        { key: "headline", label: "Headline added", met: !!mentor.headline },
        { key: "expertise", label: "Expertise and session types chosen", met: mentor.expertise.length > 0 && mentor.sessionTypes.length > 0 },
      ],
    };
  }

  private async incubatorRequirements(ownerId: string): Promise<ProfileRequirements | null> {
    const incubator = await this.prisma.incubatorProfile.findUnique({ where: { ownerId }, include: { programs: true } });
    if (!incubator) return null;
    return {
      entityType: "IncubatorProfile",
      entityId: incubator.id,
      current: incubator.verificationStatus,
      requirements: [
        {
          key: "registration",
          label: "Registration certificate uploaded",
          met: await this.hasDocument(ownerId, "INCORPORATION_CERTIFICATE"),
          documentType: "INCORPORATION_CERTIFICATE",
        },
        { key: "description", label: "Description added", met: !!incubator.description },
        { key: "industries", label: "Industries chosen", met: incubator.industries.length > 0 },
        { key: "programs", label: "At least one programme listed", met: incubator.programs.length > 0 },
      ],
    };
  }

  private async universityRequirements(ownerId: string): Promise<ProfileRequirements | null> {
    const university = await this.prisma.universityProfile.findUnique({ where: { ownerId } });
    if (!university) return null;
    return {
      entityType: "UniversityProfile",
      entityId: university.id,
      current: university.verificationStatus,
      requirements: [
        {
          key: "registration",
          label: "Registration or recognition certificate uploaded",
          met: await this.hasDocument(ownerId, "INCORPORATION_CERTIFICATE"),
          documentType: "INCORPORATION_CERTIFICATE",
        },
        {
          key: "details",
          label: "Departments or programmes listed",
          met: university.departments.length > 0 || university.programsOffered.length > 0,
        },
      ],
    };
  }

  /** The status the requirements add up to, or null when there is nothing to change (no profile, REJECTED, or already right). */
  private nextStatus(profile: ProfileRequirements | null): Exclude<VerificationStatus, "REJECTED"> | null {
    if (!profile || profile.current === "REJECTED") return null;
    const next = this.deriveStatus(profile.requirements);
    return next === profile.current ? null : next;
  }

  private verifiedFields(status: VerificationStatus) {
    return { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : null };
  }

  private async recomputeStartup(ownerId: string) {
    const profile = await this.startupRequirements(ownerId);
    const next = this.nextStatus(profile);
    if (!profile || !next) return;
    await this.prisma.startup.update({ where: { id: profile.entityId }, data: this.verifiedFields(next) });
    await this.onTransition(profile.entityType, profile.entityId, ownerId, next);
  }

  private async recomputeInvestor(ownerId: string) {
    const profile = await this.investorRequirements(ownerId);
    const next = this.nextStatus(profile);
    if (!profile || !next) return;
    await this.prisma.investor.update({ where: { id: profile.entityId }, data: this.verifiedFields(next) });
    await this.onTransition(profile.entityType, profile.entityId, ownerId, next);
  }

  private async recomputeMentor(ownerId: string) {
    const profile = await this.mentorRequirements(ownerId);
    const next = this.nextStatus(profile);
    if (!profile || !next) return;
    await this.prisma.mentorProfile.update({ where: { id: profile.entityId }, data: this.verifiedFields(next) });
    await this.onTransition(profile.entityType, profile.entityId, ownerId, next);
  }

  private async recomputeIncubator(ownerId: string) {
    const profile = await this.incubatorRequirements(ownerId);
    const next = this.nextStatus(profile);
    if (!profile || !next) return;
    await this.prisma.incubatorProfile.update({ where: { id: profile.entityId }, data: this.verifiedFields(next) });
    await this.onTransition(profile.entityType, profile.entityId, ownerId, next);
  }

  /** Universities were the one profile this engine never looked at: their status stayed UNVERIFIED whatever they added. */
  private async recomputeUniversity(ownerId: string) {
    const profile = await this.universityRequirements(ownerId);
    const next = this.nextStatus(profile);
    if (!profile || !next) return;
    // No `verifiedAt` column on this table.
    await this.prisma.universityProfile.update({ where: { id: profile.entityId }, data: { verificationStatus: next } });
    await this.onTransition(profile.entityType, profile.entityId, ownerId, next);
  }

  private async onTransition(entityType: string, entityId: string, ownerId: string, nextStatus: VerificationStatus) {
    this.logger.log(`${entityType} ${entityId} verificationStatus -> ${nextStatus}`);
    await this.auditLog.record({
      actorId: null,
      action: `${entityType.toLowerCase()}.${nextStatus.toLowerCase()}`,
      entityType,
      entityId,
    });
    await this.recordVerification(entityType, entityId, nextStatus);

    if (nextStatus === "VERIFIED") {
      this.eventEmitter.emit("profile.verified", { userId: ownerId, entityType });
    }
  }

  /**
   * Writes an audit-ledger row into the VerificationRecord table every time this
   * engine's overall status changes. Today's signals are document-presence /
   * profile-completeness checks, so the tier is V1 (not yet a registry-verified
   * V3) — see CLAUDE.md §7/§8 for why real MCA/GSTIN/DPIIT integrations are a
   * later, pluggable phase rather than blocking this ledger from existing now.
   * Verification always expires (spec §2) — 180 days is a placeholder TTL until
   * per-source expiry policy is defined.
   */
  private async recordVerification(entityType: string, entityId: string, status: VerificationStatus) {
    if (status === "UNVERIFIED") return; // no verification attempt has actually happened yet
    const recordStatus = status === "VERIFIED" ? "VERIFIED" : "PENDING";
    const now = new Date();
    await this.prisma.verificationRecord.create({
      data: {
        entityType,
        entityId,
        field: "overall",
        tier: "V1",
        method: "SIGNAL_PRESENCE_CHECK",
        status: recordStatus,
        verifiedAt: recordStatus === "VERIFIED" ? now : null,
        expiresAt: recordStatus === "VERIFIED" ? new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) : null,
        verifiedBy: "system:verification-engine",
      },
    });
  }

  /** Read path for the verification ledger — e.g. the public profile's "verified since" badge, or an admin audit view. */
  async getRecords(entityType: string, entityId: string) {
    return this.prisma.verificationRecord.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
  }
}
