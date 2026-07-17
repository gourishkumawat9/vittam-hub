import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Every chart here is a straight aggregate over the founder's own real
 * activity — never a fabricated or placeholder number. A founder with no
 * activity yet gets empty arrays, not sample data.
 */
@Injectable()
export class FounderAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForStartup(startupId: string) {
    const [weeklyViews, investorViewTotal, connectionRequests, followerCount, milestoneCount] = await Promise.all([
      this.getWeeklyProfileViews(startupId),
      this.prisma.startupProfileView.aggregate({ where: { startupId }, _sum: { viewCount: true } }),
      this.prisma.connection.count({ where: { startupId } }),
      this.prisma.startupFollow.count({ where: { startupId } }),
      this.prisma.startupMilestone.count({ where: { startupId } }),
    ]);

    return {
      weeklyProfileViews: weeklyViews,
      totalInvestorViews: investorViewTotal._sum.viewCount ?? 0,
      connectionRequestsReceived: connectionRequests,
      followerCount,
      milestoneCount,
    };
  }

  private async getWeeklyProfileViews(startupId: string) {
    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
      SELECT date_trunc('week', "viewDate") AS bucket, SUM("viewCount") AS count
      FROM "startup_profile_views"
      WHERE "startupId" = ${startupId}::uuid
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT 12
    `;
    return rows
      .map((row) => ({ label: row.bucket.toISOString().slice(0, 10), count: Number(row.count) }))
      .reverse();
  }
}
