import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { UniversitySearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Mirrors MentorsService's shape (search + get-by-id) — see docs/07-backend-architecture.md. */
@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: UniversitySearchFilters) {
    const where: Prisma.UniversityProfileWhereInput = {
      isPublic: true,
      verificationStatus: "VERIFIED",
      ...(filters.departments?.length ? { departments: { hasSome: filters.departments } } : {}),
      ...(filters.programsOffered?.length ? { programsOffered: { hasSome: filters.programsOffered } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.universityProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.universityProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getById(id: string) {
    const university = await this.prisma.universityProfile.findUnique({
      where: { id },
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });
    if (!university) throw new NotFoundException("University not found");
    return university;
  }
}
