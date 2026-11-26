import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { UniversitySearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { isDemoViewer, sameSandbox } from "../../common/demo/demo-scope";
import { LISTED_VERIFICATION, VERIFIED_FIRST } from "../../common/verification/listed-profiles";
import { PrismaService } from "../../database/prisma/prisma.service";

/** Mirrors MentorsService's shape (search + get-by-id) — see docs/07-backend-architecture.md. */
@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /** `callerId` keeps demo and real accounts apart — see common/demo/demo-scope.ts. */
  async list(filters: UniversitySearchFilters, callerId?: string | null) {
    const viewerIsDemo = await isDemoViewer(this.prisma, callerId);
    const where: Prisma.UniversityProfileWhereInput = {
      isPublic: true,
      AND: [sameSandbox(viewerIsDemo)],
      verificationStatus: LISTED_VERIFICATION,
      ...(filters.departments?.length ? { departments: { hasSome: filters.departments } } : {}),
      ...(filters.programsOffered?.length ? { programsOffered: { hasSome: filters.programsOffered } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.universityProfile.findMany({
        where,
        skip,
        take,
        orderBy: [VERIFIED_FIRST, { createdAt: "desc" }],
        include: { owner: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.universityProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  /** The caller's own profile, published or not; null until onboarding creates it. */
  getMine(ownerId: string) {
    return this.prisma.universityProfile.findUnique({
      where: { ownerId },
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });
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
