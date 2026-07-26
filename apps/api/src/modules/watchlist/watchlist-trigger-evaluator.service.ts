import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { TrustBand, WatchlistTrigger } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

const TRUST_BAND_ORDER: TrustBand[] = ["STARTING", "BRONZE", "SILVER", "GOLD", "PLATINUM"];

/**
 * The condition logic behind every "notify me when..." trigger (Investor
 * Workspace §4). Each `check*` method reads real, already-tracked data —
 * no new signal source is invented for this. Firing goes through the
 * existing NotificationsService (via `watchlist-trigger.fired` event), not
 * a separate alert-delivery path.
 */
@Injectable()
export class WatchlistTriggerEvaluatorService {
  private readonly logger = new Logger(WatchlistTriggerEvaluatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Evaluates every active, not-yet-fired trigger and fires the ones whose condition is now true. Returns how many fired. */
  async evaluateAll(): Promise<number> {
    const triggers = await this.prisma.watchlistTrigger.findMany({ where: { isActive: true, firedAt: null } });
    let fired = 0;
    for (const trigger of triggers) {
      try {
        if (await this.isConditionMet(trigger)) {
          await this.fire(trigger);
          fired++;
        }
      } catch (err) {
        this.logger.warn(`Trigger ${trigger.id} evaluation failed: ${(err as Error).message}`);
      }
    }
    return fired;
  }

  private async fire(trigger: WatchlistTrigger) {
    await this.prisma.watchlistTrigger.update({ where: { id: trigger.id }, data: { firedAt: new Date() } });
    const startup = await this.prisma.startup.findUnique({ where: { id: trigger.startupId }, select: { name: true } });
    this.eventEmitter.emit("watchlist-trigger.fired", {
      investorId: trigger.investorId,
      startupName: startup?.name ?? "A startup",
      type: trigger.type,
    });
  }

  private async isConditionMet(trigger: WatchlistTrigger): Promise<boolean> {
    switch (trigger.type) {
      case "REVENUE_ABOVE": {
        if (trigger.thresholdAmount == null) return false;
        const traction = await this.prisma.startupTraction.findUnique({ where: { startupId: trigger.startupId } });
        return !!traction?.monthlyRevenueAmount && Number(traction.monthlyRevenueAmount) > Number(trigger.thresholdAmount);
      }
      case "TRUST_BAND_REACHES": {
        if (!trigger.thresholdBand) return false;
        const latest = await this.prisma.trustScoreSnapshot.findFirst({
          where: { entityType: "Startup", entityId: trigger.startupId },
          orderBy: { computedAt: "desc" },
        });
        if (!latest) return false;
        return TRUST_BAND_ORDER.indexOf(latest.band) >= TRUST_BAND_ORDER.indexOf(trigger.thresholdBand);
      }
      case "GST_VERIFIED":
        return this.hasVerifiedRecord(trigger.startupId, "GSTIN_API");
      case "MCA_VERIFIED":
        return this.hasVerifiedRecord(trigger.startupId, "MCA_API");
      case "FUNDING_ROUND_OPENED": {
        const startup = await this.prisma.startup.findUnique({ where: { id: trigger.startupId }, select: { isFundraising: true } });
        return !!startup?.isFundraising;
      }
      case "HEADCOUNT_DOUBLED": {
        if (trigger.baselineValue == null || trigger.baselineValue <= 0) return false;
        const startup = await this.prisma.startup.findUnique({ where: { id: trigger.startupId }, select: { teamSize: true } });
        return !!startup && startup.teamSize >= trigger.baselineValue * 2;
      }
      case "NEW_FOUNDER_ADDED": {
        const count = await this.prisma.startupTeamMember.count({
          where: {
            startupId: trigger.startupId,
            category: { in: ["FOUNDER", "COFOUNDER"] },
            createdAt: { gt: trigger.createdAt },
          },
        });
        return count > 0;
      }
      case "VERIFICATION_COMPLETED": {
        const startup = await this.prisma.startup.findUnique({ where: { id: trigger.startupId }, select: { verificationStatus: true } });
        return startup?.verificationStatus === "VERIFIED";
      }
      case "NEW_METRICS_UPLOADED": {
        const count = await this.prisma.metricObservation.count({
          where: { startupId: trigger.startupId, recordedAt: { gt: trigger.createdAt } },
        });
        return count > 0;
      }
      case "NEW_CAP_TABLE_INVESTOR": {
        const count = await this.prisma.relationshipClaim.count({
          where: {
            status: "CONFIRMED",
            relationshipType: { in: ["PORTFOLIO_INVESTMENT", "LEAD_INVESTOR"] },
            targetType: "Startup",
            targetId: trigger.startupId,
            createdAt: { gt: trigger.createdAt },
          },
        });
        return count > 0;
      }
      case "PRODUCT_LAUNCHED": {
        const count = await this.prisma.startupMilestone.count({
          where: { startupId: trigger.startupId, type: "PRODUCT_LAUNCH", achievedAt: { gt: trigger.createdAt } },
        });
        return count > 0;
      }
      case "PATENT_GRANTED": {
        const traction = await this.prisma.startupTraction.findUnique({ where: { startupId: trigger.startupId } });
        return !!traction && traction.patents.length > (trigger.baselineValue ?? 0);
      }
      case "MILESTONE_POSTED": {
        const count = await this.prisma.startupMilestone.count({
          where: { startupId: trigger.startupId, achievedAt: { gt: trigger.createdAt } },
        });
        return count > 0;
      }
      default:
        return false;
    }
  }

  private async hasVerifiedRecord(startupId: string, method: string): Promise<boolean> {
    const count = await this.prisma.verificationRecord.count({
      where: { entityType: "Startup", entityId: startupId, method, status: "VERIFIED" },
    });
    return count > 0;
  }
}
