import { Injectable, NotFoundException } from "@nestjs/common";
import type { MissingProfileItem, ProfileCompletion } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

interface CompletionCheckContext {
  hasPitchDeck: boolean;
  teamCount: number;
  hasDemo: boolean;
  isVerified: boolean;
  hasWebsite: boolean;
  hasRevenueData: boolean;
  hasRecentMilestone: boolean;
}

interface CompletionCheck {
  key: string;
  label: string;
  href: string;
  isComplete: (ctx: CompletionCheckContext) => boolean;
}

const RECENT_MILESTONE_WINDOW_DAYS = 90;

const CHECKS: CompletionCheck[] = [
  { key: "website", label: "Missing website", href: "/founder", isComplete: (ctx) => ctx.hasWebsite },
  { key: "pitchDeck", label: "Missing pitch deck", href: "/founder", isComplete: (ctx) => ctx.hasPitchDeck },
  { key: "team", label: "Missing team", href: "/founder", isComplete: (ctx) => ctx.teamCount > 0 },
  { key: "verification", label: "Missing verification", href: "/founder", isComplete: (ctx) => ctx.isVerified },
  { key: "productDemo", label: "Missing product demo", href: "/founder", isComplete: (ctx) => ctx.hasDemo },
  { key: "revenueData", label: "Add your monthly revenue", href: "/founder", isComplete: (ctx) => ctx.hasRevenueData },
  {
    key: "recentMilestone",
    label: "Update your milestones — nothing added in the last 90 days",
    href: "/founder",
    isComplete: (ctx) => ctx.hasRecentMilestone,
  },
];

/** Drives the founder dashboard's "Profile Completion" card — same checks feed TrustScoreService's completion factor. */
@Injectable()
export class ProfileCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(startupId: string): Promise<ProfileCompletion> {
    const startup = await this.prisma.startup.findUnique({
      where: { id: startupId },
      include: { teamMembers: true, product: true, traction: true },
    });
    if (!startup) throw new NotFoundException("Startup not found");

    const recentMilestoneSince = new Date();
    recentMilestoneSince.setDate(recentMilestoneSince.getDate() - RECENT_MILESTONE_WINDOW_DAYS);

    const [pitchDeck, recentMilestone] = await Promise.all([
      this.prisma.document.findFirst({ where: { userId: startup.ownerId, type: "PITCH_DECK" } }),
      this.prisma.startupMilestone.findFirst({ where: { startupId, achievedAt: { gte: recentMilestoneSince } } }),
    ]);

    const ctx: CompletionCheckContext = {
      hasPitchDeck: !!pitchDeck,
      teamCount: startup.teamMembers.length,
      hasDemo: !!startup.product?.demoVideoUrl,
      isVerified: startup.verificationStatus === "VERIFIED",
      hasWebsite: !!startup.website,
      hasRevenueData: startup.traction?.monthlyRevenueUsd != null,
      hasRecentMilestone: !!recentMilestone,
    };

    const missing: MissingProfileItem[] = CHECKS.filter((check) => !check.isComplete(ctx)).map((check) => ({
      key: check.key,
      label: check.label,
      href: check.href,
    }));

    const percent = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100);
    return { percent, missing };
  }
}
