import { Injectable } from "@nestjs/common";
import type { FounderActivityEntry } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Document types safe to surface as "uploaded a document" activity — never KYC/financial documents (CLAUDE.md §7: those exist purely for future automated verification, never disclosure). */
const PUBLIC_SAFE_DOCUMENT_TYPES = ["PITCH_DECK"] as const;

/**
 * Read-time merge across several tables, never a denormalized write-side
 * table — matches RecommendationsService's "always a real DB aggregate,
 * never a black box" philosophy, and means a forgotten event listener can
 * never silently produce an incomplete feed.
 *
 * Two visibility tiers: `getPublicForStartup` (milestones, startup-update
 * posts, job postings, one traction entry) is safe to show any visitor;
 * `getOwnerForStartup` additionally includes connection requests received
 * and pitch-deck uploads, which are only ever shown to the founder who owns
 * the startup — never on the public profile or to other investors browsing.
 */
@Injectable()
export class FounderActivityService {
  constructor(private readonly prisma: PrismaService) {}

  getPublicForStartup(startupId: string, limit = 20) {
    return this.aggregate(startupId, false, limit);
  }

  getOwnerForStartup(startupId: string, limit = 20) {
    return this.aggregate(startupId, true, limit);
  }

  /** Distinct startupIds with any activity-table row in the last `days` days, most-recent-first — backs "recently active founders" (a real signal; Startup.updatedAt alone doesn't move when child-table rows change). */
  async recentlyActiveStartupIds(days: number, limit: number): Promise<string[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [milestoneStartups, postStartups, jobStartups] = await Promise.all([
      this.prisma.startupMilestone.findMany({
        where: { createdAt: { gte: since } },
        distinct: ["startupId"],
        select: { startupId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.post.findMany({
        where: { type: "STARTUP_UPDATE", startupId: { not: null }, createdAt: { gte: since } },
        distinct: ["startupId"],
        select: { startupId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.job.findMany({
        where: { createdAt: { gte: since } },
        distinct: ["startupId"],
        select: { startupId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const mostRecentByStartup = new Map<string, Date>();
    for (const row of [...milestoneStartups, ...postStartups, ...jobStartups]) {
      const startupId = row.startupId;
      if (!startupId) continue;
      const existing = mostRecentByStartup.get(startupId);
      if (!existing || row.createdAt > existing) mostRecentByStartup.set(startupId, row.createdAt);
    }

    return Array.from(mostRecentByStartup.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .slice(0, limit)
      .map(([startupId]) => startupId);
  }

  private async aggregate(startupId: string, includeOwnerTier: boolean, limit: number): Promise<FounderActivityEntry[]> {
    const startup = await this.prisma.startup.findUnique({ where: { id: startupId }, include: { traction: true } });
    if (!startup) return [];

    const [milestones, updates, jobs, connectionsReceived, documents] = await Promise.all([
      this.prisma.startupMilestone.findMany({ where: { startupId }, orderBy: { achievedAt: "desc" }, take: limit }),
      this.prisma.post.findMany({ where: { startupId, type: "STARTUP_UPDATE" }, orderBy: { createdAt: "desc" }, take: limit }),
      this.prisma.job.findMany({ where: { startupId }, orderBy: { createdAt: "desc" }, take: limit }),
      includeOwnerTier
        ? this.prisma.connection.findMany({
            where: { startupId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { requester: { select: { fullName: true } } },
          })
        : Promise.resolve([]),
      includeOwnerTier
        ? this.prisma.document.findMany({
            where: { userId: startup.ownerId, type: { in: [...PUBLIC_SAFE_DOCUMENT_TYPES] } },
            orderBy: { uploadedAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const entries: FounderActivityEntry[] = [
      ...milestones.map((m) => ({
        id: `milestone:${m.id}`,
        type: "MILESTONE" as const,
        occurredAt: m.achievedAt.toISOString(),
        title: m.title,
        description: m.description,
      })),
      ...updates.map((post) => ({
        id: `update:${post.id}`,
        type: "STARTUP_UPDATE" as const,
        occurredAt: post.createdAt.toISOString(),
        title: "Posted a startup update",
        description: post.body,
      })),
      ...jobs.map((job) => ({
        id: `job:${job.id}`,
        type: "JOB_POSTED" as const,
        occurredAt: job.createdAt.toISOString(),
        title: `Posted a job: ${job.title}`,
        description: null,
      })),
      ...connectionsReceived.map((connection) => ({
        id: `connection:${connection.id}`,
        type: "CONNECTION_RECEIVED" as const,
        occurredAt: connection.createdAt.toISOString(),
        title: `${connection.requester.fullName} sent a connect request`,
        description: null,
      })),
      ...documents.map((document) => ({
        id: `document:${document.id}`,
        type: "DOCUMENT_UPLOADED" as const,
        occurredAt: document.uploadedAt.toISOString(),
        title: "Uploaded pitch deck",
        description: null,
      })),
    ];

    // One synthetic entry for traction changes — only if traction was ever
    // touched after publish, so a freshly-published startup that never
    // revisited its traction numbers doesn't get a noise entry.
    if (startup.traction && startup.publishedAt && startup.traction.updatedAt > startup.publishedAt) {
      entries.push({
        id: `traction:${startup.id}`,
        type: "TRACTION_UPDATED",
        occurredAt: startup.traction.updatedAt.toISOString(),
        title: "Updated traction metrics",
        description: null,
      });
    }

    // One synthetic entry once verification completes — a real, public trust signal.
    if (startup.verifiedAt) {
      entries.push({
        id: `verification:${startup.id}`,
        type: "VERIFICATION_COMPLETED",
        occurredAt: startup.verifiedAt.toISOString(),
        title: "Verification completed",
        description: null,
      });
    }

    return entries.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, limit);
  }
}
