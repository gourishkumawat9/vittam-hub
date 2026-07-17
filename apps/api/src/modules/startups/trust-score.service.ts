import { Injectable, NotFoundException } from "@nestjs/common";
import type { ScoreBand, TrustScore, TrustScoreFactor } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { ProfileCompletionService } from "./profile-completion.service";

/**
 * Trust Score is always computed from real signals, never manually assigned
 * (see CLAUDE.md §6 — no human verification/scoring anywhere in this
 * product). Weights sum to 100; each factor is a simple, auditable boolean
 * check rather than a black-box model, so a founder can always see exactly
 * why their score is what it is.
 */
@Injectable()
export class TrustScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileCompletion: ProfileCompletionService,
  ) {}

  async calculate(startupId: string): Promise<TrustScore> {
    const startup = await this.prisma.startup.findUnique({
      where: { id: startupId },
      include: { owner: { include: { profile: true } }, product: true, milestones: true },
    });
    if (!startup) throw new NotFoundException("Startup not found");

    const pitchDeck = await this.prisma.document.findFirst({
      where: { userId: startup.ownerId, type: "PITCH_DECK" },
    });

    const completion = await this.profileCompletion.calculate(startupId);

    const factors: TrustScoreFactor[] = [
      { key: "emailVerified", label: "Email verified", weight: 15, earned: !!startup.owner.emailVerifiedAt },
      {
        key: "phoneProvided",
        label: "Phone number on file",
        weight: 5,
        earned: !!startup.owner.profile?.mobileNumber,
      },
      { key: "website", label: "Website added", weight: 10, earned: !!startup.website },
      { key: "linkedin", label: "LinkedIn added", weight: 10, earned: !!startup.owner.profile?.linkedinUrl },
      {
        key: "companyRegistered",
        label: "Company registration on record",
        weight: 15,
        earned: startup.registrationStatus === "REGISTERED",
      },
      { key: "pitchDeck", label: "Pitch deck uploaded", weight: 15, earned: !!pitchDeck },
      { key: "productDemo", label: "Product demo added", weight: 10, earned: !!startup.product?.demoVideoUrl },
      { key: "profileCompletion", label: "Profile at least 80% complete", weight: 10, earned: completion.percent >= 80 },
      {
        key: "founderDetails",
        label: "Founder bio and location complete",
        weight: 5,
        earned: !!(startup.owner.profile?.bio && startup.owner.profile?.city),
      },
      { key: "timeline", label: "At least one milestone added", weight: 5, earned: startup.milestones.length > 0 },
    ];

    const score = factors.reduce((total, factor) => total + (factor.earned ? factor.weight : 0), 0);
    return { score, band: this.deriveBand(score), factors };
  }

  /** The only form of the score ever shown to anyone but the owner — see startups.controller.ts for where the full factors breakdown gets trimmed off. */
  deriveBand(score: number): ScoreBand {
    if (score >= 90) return "EXCELLENT";
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }
}
