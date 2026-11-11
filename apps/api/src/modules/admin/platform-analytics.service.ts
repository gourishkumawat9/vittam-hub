import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AdminUserListFilters, SignupsFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Demo logins (modules/demo) are left out of every platform number, so they never inflate the real counts (CLAUDE.md §2). */
const REAL_USER = { isDemo: false } as const;

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
      this.prisma.user.count({ where: REAL_USER }),
      this.prisma.startup.count({ where: { owner: REAL_USER } }),
      this.prisma.investor.count({ where: { owner: REAL_USER } }),
      this.prisma.connection.count({ where: { requester: REAL_USER } }),
    ]);
    return { users, startups, investors, connections };
  }

  /** `bucket` is validated by signupsFiltersSchema (enum "week"|"month") before this ever runs, and is passed as a query parameter, never string-concatenated, into the raw SQL. */
  async getSignupsOverTime(filters: SignupsFilters) {
    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
      SELECT date_trunc(${filters.bucket}, "createdAt") AS bucket, COUNT(*) AS count
      FROM "users"
      WHERE "isDemo" = false
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT ${filters.limit}
    `;
    return rows.map((row) => ({ bucket: row.bucket.toISOString(), count: Number(row.count) })).reverse();
  }

  async getConnectionAcceptanceRate() {
    const [accepted, declined] = await Promise.all([
      this.prisma.connection.count({ where: { status: "ACCEPTED", requester: REAL_USER } }),
      this.prisma.connection.count({ where: { status: "DECLINED", requester: REAL_USER } }),
    ]);
    const total = accepted + declined;
    return { rate: total > 0 ? accepted / total : null, accepted, declined };
  }

  async getVerificationFunnel() {
    const counts = await this.prisma.startup.groupBy({ by: ["verificationStatus"], where: { owner: REAL_USER }, _count: true });
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
        select: { id: true, email: true, fullName: true, role: true, verificationStatus: true, isDemo: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }
}
