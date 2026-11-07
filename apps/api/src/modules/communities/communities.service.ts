import { Injectable } from "@nestjs/common";
import { COMMUNITY_DOMAINS, Industry, industryToCommunitySlug } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * The community directory and memberships. Communities are the Industry enum,
 * so listing is two grouped counts plus the caller's memberships, never a
 * query per community.
 */
@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [memberCounts, discussionCounts, memberships] = await Promise.all([
      this.prisma.communityMembership.groupBy({ by: ["industry"], _count: { _all: true } }),
      this.prisma.discussion.groupBy({ by: ["industry"], _count: { _all: true } }),
      this.prisma.communityMembership.findMany({ where: { userId }, select: { industry: true } }),
    ]);

    const members = new Map(memberCounts.map((row) => [row.industry, row._count._all]));
    const discussions = new Map(discussionCounts.map((row) => [row.industry, row._count._all]));
    const joined = new Set(memberships.map((row) => row.industry));

    return Object.values(Industry).map((industry) => ({
      industry,
      slug: industryToCommunitySlug(industry),
      ...COMMUNITY_DOMAINS[industry],
      memberCount: members.get(industry) ?? 0,
      discussionCount: discussions.get(industry) ?? 0,
      isMember: joined.has(industry),
    }));
  }

  async get(userId: string, industry: Industry) {
    const [memberCount, discussionCount, membership] = await Promise.all([
      this.prisma.communityMembership.count({ where: { industry } }),
      this.prisma.discussion.count({ where: { industry } }),
      this.prisma.communityMembership.findUnique({ where: { userId_industry: { userId, industry } } }),
    ]);

    return {
      industry,
      slug: industryToCommunitySlug(industry),
      ...COMMUNITY_DOMAINS[industry],
      memberCount,
      discussionCount,
      isMember: !!membership,
    };
  }

  /** Idempotent: joining twice or leaving a community you're not in is a no-op, not an error. */
  async join(userId: string, industry: Industry) {
    await this.prisma.communityMembership.upsert({
      where: { userId_industry: { userId, industry } },
      create: { userId, industry },
      update: {},
    });
    return { isMember: true };
  }

  async leave(userId: string, industry: Industry) {
    await this.prisma.communityMembership.deleteMany({ where: { userId, industry } });
    return { isMember: false };
  }
}
