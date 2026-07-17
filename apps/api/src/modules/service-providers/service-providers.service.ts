import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { ServiceProviderSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Mirrors MentorsService's shape (search + get-by-id) — see docs/07-backend-architecture.md. */
@Injectable()
export class ServiceProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ServiceProviderSearchFilters) {
    const where: Prisma.ServiceProviderProfileWhereInput = {
      isPublic: true,
      verificationStatus: "VERIFIED",
      ...(filters.categories?.length ? { categories: { hasSome: filters.categories } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.serviceProviderProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.serviceProviderProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getById(id: string) {
    const serviceProvider = await this.prisma.serviceProviderProfile.findUnique({
      where: { id },
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });
    if (!serviceProvider) throw new NotFoundException("Service provider not found");
    return serviceProvider;
  }
}
