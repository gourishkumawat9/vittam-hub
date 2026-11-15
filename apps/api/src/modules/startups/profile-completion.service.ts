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
  /** "Registered" on the profile, or an incorporation certificate uploaded. */
  hasRegistrationProof: boolean;
}

interface CompletionCheck {
  key: string;
  label: string | ((ctx: CompletionCheckContext) => string);
  href: string | ((ctx: CompletionCheckContext) => string);
  isComplete: (ctx: CompletionCheckContext) => boolean;
}

const RECENT_MILESTONE_WINDOW_DAYS = 90;

/**
 * `href` is where the founder fixes that item. Every one used to be
 * "/founder", the dashboard the list is shown on, so "Fix" went nowhere. The
 * wizard opens a live profile on the step named in `?step=`.
 */
const CHECKS: CompletionCheck[] = [
  { key: "website", label: "Add your website", href: "/onboarding/founder?step=startup-info", isComplete: (ctx) => ctx.hasWebsite },
  { key: "pitchDeck", label: "Upload your pitch deck", href: "/founder/documents", isComplete: (ctx) => ctx.hasPitchDeck },
  { key: "team", label: "Add your team", href: "/onboarding/founder?step=team", isComplete: (ctx) => ctx.teamCount > 0 },
  { key: "productDemo", label: "Add a product demo video", href: "/onboarding/founder?step=product", isComplete: (ctx) => ctx.hasDemo },
  {
    key: "revenueData",
    label: "Add your monthly revenue",
    href: "/onboarding/founder?step=traction",
    isComplete: (ctx) => ctx.hasRevenueData,
  },
  {
    // The dashboard opens its "Add milestone" dialog for this one.
    key: "recentMilestone",
    label: "Add a milestone from the last 90 days",
    href: "/founder",
    isComplete: (ctx) => ctx.hasRecentMilestone,
  },
  {
    // Awarded automatically (VerificationEngineService) for: a pitch deck,
    // 80% of this list, and either "registered" on the profile or the
    // incorporation certificate. Nobody reviews it by hand, so the line says
    // which of those is still missing instead of "missing verification".
    key: "verification",
    label: (ctx) =>
      ctx.hasRegistrationProof
        ? "Verified badge: added automatically once the rest of this list is done"
        : "Verified badge: upload your incorporation certificate",
    href: (ctx) => (ctx.hasRegistrationProof ? "/founder" : "/founder/documents"),
    isComplete: (ctx) => ctx.isVerified,
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

    const [pitchDeck, recentMilestone, incorporationCertificate] = await Promise.all([
      this.prisma.document.findFirst({ where: { userId: startup.ownerId, type: "PITCH_DECK" } }),
      this.prisma.startupMilestone.findFirst({ where: { startupId, achievedAt: { gte: recentMilestoneSince } } }),
      this.prisma.document.findFirst({ where: { userId: startup.ownerId, type: "INCORPORATION_CERTIFICATE" } }),
    ]);

    const ctx: CompletionCheckContext = {
      hasPitchDeck: !!pitchDeck,
      teamCount: startup.teamMembers.length,
      hasDemo: !!startup.product?.demoVideoUrl,
      isVerified: startup.verificationStatus === "VERIFIED",
      hasWebsite: !!startup.website,
      hasRevenueData: startup.traction?.monthlyRevenueAmount != null,
      hasRecentMilestone: !!recentMilestone,
      hasRegistrationProof: startup.registrationStatus === "REGISTERED" || !!incorporationCertificate,
    };

    const missing: MissingProfileItem[] = CHECKS.filter((check) => !check.isComplete(ctx)).map((check) => ({
      key: check.key,
      label: typeof check.label === "function" ? check.label(ctx) : check.label,
      href: typeof check.href === "function" ? check.href(ctx) : check.href,
    }));

    const percent = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100);
    return { percent, missing };
  }
}
