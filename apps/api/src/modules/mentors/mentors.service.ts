import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { MentorSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Mirrors InvestorsService's shape (search + get-by-id) — see docs/07-backend-architecture.md. */
@Injectable()
export class MentorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: MentorSearchFilters) {
    const where: Prisma.MentorProfileWhereInput = {
      isPublic: true,
      verificationStatus: "VERIFIED",
      ...(filters.expertise?.length ? { expertise: { hasSome: filters.expertise } } : {}),
      ...(filters.industries?.length ? { industries: { hasSome: filters.industries } } : {}),
      ...(filters.sessionTypes?.length ? { sessionTypes: { hasSome: filters.sessionTypes } } : {}),
      ...(filters.query
        ? {
            OR: [
              { headline: { contains: filters.query, mode: "insensitive" } },
              { owner: { fullName: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getById(id: string) {
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id },
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });
    if (!mentor) throw new NotFoundException("Mentor not found");
    return mentor;
  }
}
