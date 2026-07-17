import { Injectable } from "@nestjs/common";
import type { FounderReputation, TrustScoreFactor } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { FounderActivityService } from "./founder-activity.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { TrustScoreService } from "./trust-score.service";

const ACTIVITY_WINDOW_DAYS = 30;
const YEARS_ACTIVE_THRESHOLD_DAYS = 180;

/**
 * A separate axis from Trust Score: Trust Score asks "is this startup real
 * and complete," Founder Reputation asks "is this founder good to work with
 * professionally" (activity, community participation, mentor reviews,
 * tenure). Never merged into one number. Same auditable-factors style as
 * TrustScoreService — reads FounderReview rows straight off Prisma, the same
 * way TrustScoreService reads Document rows, without importing the mentors
 * module.
 */
@Injectable()
export class FounderReputationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly founderActivityService: FounderActivityService,
    private readonly profileCompletionService: ProfileCompletionService,
    private readonly trustScoreService: TrustScoreService,
  ) {}

  async calculate(founderId: string, startupId: string): Promise<FounderReputation> {
    const [activity, completion, participationCount, reviews, user] = await Promise.all([
      this.founderActivityService.getOwnerForStartup(startupId),
      this.profileCompletionService.calculate(startupId),
      this.prisma.post.count({ where: { authorId: founderId } }).then(async (postCount) => {
        const commentCount = await this.prisma.comment.count({ where: { authorId: founderId } });
        return postCount + commentCount;
      }),
      this.prisma.founderReview.findMany({ where: { founderId }, select: { rating: true } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: founderId }, select: { createdAt: true } }),
    ]);

    const startup = await this.prisma.startup.findUniqueOrThrow({ where: { id: startupId }, select: { verificationStatus: true } });

    const activityWindowStart = new Date();
    activityWindowStart.setDate(activityWindowStart.getDate() - ACTIVITY_WINDOW_DAYS);
    const recentActivityCount = activity.filter((entry) => new Date(entry.occurredAt) >= activityWindowStart).length;

    const yearsActiveThreshold = new Date();
    yearsActiveThreshold.setDate(yearsActiveThreshold.getDate() - YEARS_ACTIVE_THRESHOLD_DAYS);

    const hasReviews = reviews.length > 0;
    const avgRating = hasReviews ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    const factors: TrustScoreFactor[] = [
      { key: "activityLevel", label: "Active in the last 30 days", weight: 15, earned: recentActivityCount > 0 },
      { key: "profileQuality", label: "Profile at least 80% complete", weight: 15, earned: completion.percent >= 80 },
      { key: "verification", label: "Startup verified", weight: 20, earned: startup.verificationStatus === "VERIFIED" },
      { key: "communityParticipation", label: "Active in the Community", weight: 15, earned: participationCount > 0 },
      // A founder with zero reviews isn't penalized vs. one with a single bad review — only counted once ≥1 review exists.
      { key: "mentorReviews", label: "Positively reviewed by mentors", weight: 25, earned: hasReviews && avgRating! >= 3.5 },
      { key: "yearsActive", label: "On VittamHub for 6+ months", weight: 10, earned: user.createdAt <= yearsActiveThreshold },
    ];

    const score = factors.reduce((total, factor) => total + (factor.earned ? factor.weight : 0), 0);
    return { score, band: this.trustScoreService.deriveBand(score), factors };
  }
}
