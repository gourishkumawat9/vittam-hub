import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { IncubatorSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Read-only directory — no application flow beyond surfacing each program's
 * applicationUrl/eligibilityCriteria/cycle dates; founders click through
 * externally, same as any other outbound link on the platform.
 */
@Injectable()
export class IncubatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: IncubatorSearchFilters) {
    const where: Prisma.IncubatorProfileWhereInput = {
      isPublic: true,
      verificationStatus: "VERIFIED",
      ...(filters.industries?.length ? { industries: { hasSome: filters.industries } } : {}),
      ...(filters.kind?.length ? { kind: { in: filters.kind } } : {}),
      ...(filters.query
        ? {
            OR: [
              { organizationName: { contains: filters.query, mode: "insensitive" } },
              { description: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.incubatorProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { programs: true },
      }),
      this.prisma.incubatorProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getById(id: string) {
    const incubator = await this.prisma.incubatorProfile.findUnique({
      where: { id },
      include: { programs: true },
    });
    if (!incubator) throw new NotFoundException("Incubator not found");
    return incubator;
  }
}
