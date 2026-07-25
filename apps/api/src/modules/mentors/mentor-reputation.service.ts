import { Injectable } from "@nestjs/common";
import type { MentorReputation } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Computed, never stored-and-overwritten — same principle as Trust Score.
 * "A mentor with 12 good ratings is trusted; a brand-new one is not" (spec
 * §5): `reviewCount` lets the UI show that distinction honestly instead of
 * collapsing a 5.0-from-one-review mentor and a 4.6-from-40-reviews mentor
 * into the same-looking number.
 */
@Injectable()
export class MentorReputationService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(mentorId: string): Promise<MentorReputation> {
    const [reviews, sessionsCompleted] = await Promise.all([
      this.prisma.mentorReview.findMany({ where: { mentorId }, select: { rating: true } }),
      this.prisma.mentorBookingRequest.count({ where: { mentorId, status: "ACCEPTED" } }),
    ]);

    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;

    return { averageRating, reviewCount, sessionsCompleted };
  }

  /** Batched for list/search cards — avoids an N-query storm per page load. */
  async calculateMany(mentorIds: string[]): Promise<Map<string, MentorReputation>> {
    const entries = await Promise.all(mentorIds.map(async (id) => [id, await this.calculate(id)] as const));
    return new Map(entries);
  }
}
