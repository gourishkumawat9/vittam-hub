import { Injectable } from "@nestjs/common";
import type { InvestorMetrics } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

const ACTIVE_WINDOW_DAYS = 14;

/**
 * Real signals computed from Connection history — same "auditable, never a
 * black box" style as MatchScoreService/TrustScoreService. Lets founders see
 * which investors actually respond, and how quickly, before spending one of
 * their limited monthly connect requests on them.
 */
@Injectable()
export class InvestorMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFor(investorOwnerId: string): Promise<InvestorMetrics> {
    const [connections, investor] = await Promise.all([
      this.prisma.connection.findMany({
        where: { recipientId: investorOwnerId, status: { not: "WITHDRAWN" } },
        select: { status: true, createdAt: true, respondedAt: true },
      }),
      this.prisma.investor.findUnique({ where: { ownerId: investorOwnerId }, select: { updatedAt: true } }),
    ]);

    const totalReceived = connections.length;
    const responded = connections.filter((c) => c.status === "ACCEPTED" || c.status === "DECLINED");
    const responseRate = totalReceived > 0 ? responded.length / totalReceived : null;

    const responseTimesHours = connections
      .filter((c): c is typeof c & { respondedAt: Date } => c.respondedAt !== null)
      .map((c) => (c.respondedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60));
    const avgResponseTimeHours =
      responseTimesHours.length > 0 ? responseTimesHours.reduce((sum, hours) => sum + hours, 0) / responseTimesHours.length : null;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ACTIVE_WINDOW_DAYS);
    const mostRecentResponseAt = connections
      .map((c) => c.respondedAt)
      .filter((respondedAt): respondedAt is Date => respondedAt !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const isActive = (investor?.updatedAt ?? new Date(0)) >= cutoff || (mostRecentResponseAt ?? new Date(0)) >= cutoff;

    return { responseRate, avgResponseTimeHours, isActive };
  }

  async getManyFor(investorOwnerIds: string[]): Promise<Map<string, InvestorMetrics>> {
    const entries = await Promise.all(investorOwnerIds.map(async (ownerId) => [ownerId, await this.getFor(ownerId)] as const));
    return new Map(entries);
  }
}
