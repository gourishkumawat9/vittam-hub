import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AdminUserListFilters, SignupsFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Platform-wide, read-only metrics for the admin panel — no PII beyond what
 * the existing verification-overview lists already expose, no ban/edit/
 * role-change action anywhere (CLAUDE.md §6: no manual gatekeeping).
 */
@Injectable()
export class PlatformAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotals() {
    const [users, startups, investors, connections] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.startup.count(),
      this.prisma.investor.count(),
      this.prisma.connection.count(),
    ]);
    return { users, startups, investors, connections };
  }

  /** `bucket` is validated by signupsFiltersSchema (enum "week"|"month") before this ever runs, and is passed as a query parameter, never string-concatenated, into the raw SQL. */
  async getSignupsOverTime(filters: SignupsFilters) {
    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
      SELECT date_trunc(${filters.bucket}, "createdAt") AS bucket, COUNT(*) AS count
      FROM "users"
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT ${filters.limit}
    `;
    return rows.map((row) => ({ bucket: row.bucket.toISOString(), count: Number(row.count) })).reverse();
  }

  async getConnectionAcceptanceRate() {
    const [accepted, declined] = await Promise.all([
      this.prisma.connection.count({ where: { status: "ACCEPTED" } }),
      this.prisma.connection.count({ where: { status: "DECLINED" } }),
    ]);
    const total = accepted + declined;
    return { rate: total > 0 ? accepted / total : null, accepted, declined };
  }

  async getVerificationFunnel() {
    const counts = await this.prisma.startup.groupBy({ by: ["verificationStatus"], _count: true });
    const byStatus = new Map(counts.map((c) => [c.verificationStatus, c._count]));
    return (["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const).map((stage) => ({
      stage,
      count: byStatus.get(stage) ?? 0,
    }));
  }

  async listUsers(filters: AdminUserListFilters) {
    const where: Prisma.UserWhereInput = {
      ...(filters.query
        ? {
            OR: [
              { email: { contains: filters.query, mode: "insensitive" } },
              { fullName: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.role?.length ? { role: { in: filters.role } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, fullName: true, role: true, verificationStatus: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }
}
