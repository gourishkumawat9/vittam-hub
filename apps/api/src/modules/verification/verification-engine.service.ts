import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import type { VerificationStatus } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { ProfileCompletionService } from "../startups/profile-completion.service";

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
    ]);
  }

  /** Never returns REJECTED — every caller already guards `verificationStatus === "REJECTED"` before reaching here. */
  private deriveStatus(requiredSignals: boolean[]): Exclude<VerificationStatus, "REJECTED"> {
    const metCount = requiredSignals.filter(Boolean).length;
    if (metCount === requiredSignals.length) return "VERIFIED";
    if (metCount === 0) return "UNVERIFIED";
    return "PENDING";
  }

  private async recomputeStartup(ownerId: string) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId } });
    if (!startup || startup.verificationStatus === "REJECTED") return;

    const [incorporationDoc, pitchDeckDoc, completion] = await Promise.all([
      this.prisma.document.findFirst({ where: { userId: ownerId, type: "INCORPORATION_CERTIFICATE" } }),
      this.prisma.document.findFirst({ where: { userId: ownerId, type: "PITCH_DECK" } }),
      this.profileCompletion.calculate(startup.id),
    ]);

    const nextStatus = this.deriveStatus([
      startup.registrationStatus === "REGISTERED" || !!incorporationDoc,
      !!pitchDeckDoc,
      completion.percent >= 80,
    ]);

    if (nextStatus === startup.verificationStatus) return;
    await this.prisma.startup.update({
      where: { id: startup.id },
      data: { verificationStatus: nextStatus, verifiedAt: nextStatus === "VERIFIED" ? new Date() : null },
    });
    await this.onTransition("Startup", startup.id, ownerId, nextStatus);
  }

  private async recomputeInvestor(ownerId: string) {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId } });
    if (!investor || investor.verificationStatus === "REJECTED") return;

    const governmentIdDoc = await this.prisma.document.findFirst({ where: { userId: ownerId, type: "GOVERNMENT_ID" } });

    const nextStatus = this.deriveStatus([
      !!governmentIdDoc,
      investor.bio.trim().length > 0 && investor.preferredIndustries.length > 0 && investor.preferredStages.length > 0,
    ]);

    if (nextStatus === investor.verificationStatus) return;
    await this.prisma.investor.update({
      where: { id: investor.id },
      data: { verificationStatus: nextStatus, verifiedAt: nextStatus === "VERIFIED" ? new Date() : null },
    });
    await this.onTransition("Investor", investor.id, ownerId, nextStatus);
  }

  private async recomputeMentor(ownerId: string) {
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { ownerId } });
    if (!mentor || mentor.verificationStatus === "REJECTED") return;

    const governmentIdDoc = await this.prisma.document.findFirst({ where: { userId: ownerId, type: "GOVERNMENT_ID" } });

    const nextStatus = this.deriveStatus([
      !!governmentIdDoc,
      !!mentor.headline,
      mentor.expertise.length > 0 && mentor.sessionTypes.length > 0,
    ]);

    if (nextStatus === mentor.verificationStatus) return;
    await this.prisma.mentorProfile.update({
      where: { id: mentor.id },
      data: { verificationStatus: nextStatus, verifiedAt: nextStatus === "VERIFIED" ? new Date() : null },
    });
    await this.onTransition("MentorProfile", mentor.id, ownerId, nextStatus);
  }

  private async recomputeIncubator(ownerId: string) {
    const incubator = await this.prisma.incubatorProfile.findUnique({
      where: { ownerId },
      include: { programs: true },
    });
    if (!incubator || incubator.verificationStatus === "REJECTED") return;

    const incorporationDoc = await this.prisma.document.findFirst({
      where: { userId: ownerId, type: "INCORPORATION_CERTIFICATE" },
    });

    const nextStatus = this.deriveStatus([
      !!incorporationDoc,
      !!incubator.description,
      incubator.industries.length > 0,
      incubator.programs.length > 0,
    ]);

    if (nextStatus === incubator.verificationStatus) return;
    await this.prisma.incubatorProfile.update({
      where: { id: incubator.id },
      data: { verificationStatus: nextStatus, verifiedAt: nextStatus === "VERIFIED" ? new Date() : null },
    });
    await this.onTransition("IncubatorProfile", incubator.id, ownerId, nextStatus);
  }

  private async onTransition(entityType: string, entityId: string, ownerId: string, nextStatus: VerificationStatus) {
    this.logger.log(`${entityType} ${entityId} verificationStatus -> ${nextStatus}`);
    await this.auditLog.record({
      actorId: null,
      action: `${entityType.toLowerCase()}.${nextStatus.toLowerCase()}`,
      entityType,
      entityId,
    });

    if (nextStatus === "VERIFIED") {
      this.eventEmitter.emit("profile.verified", { userId: ownerId, entityType });
    }
  }
}
