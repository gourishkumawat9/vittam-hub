import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateStartupInput, StartupSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset, slugify } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class StartupsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(filters: StartupSearchFilters) {
    const where = {
      isPublic: true,
      verificationStatus: "VERIFIED" as const,
      ...(filters.industry?.length ? { industry: { in: filters.industry } } : {}),
      ...(filters.stage?.length ? { stage: { in: filters.stage } } : {}),
      ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" as const } } : {}),
      ...(filters.isFundraising !== undefined ? { isFundraising: filters.isFundraising } : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" as const } },
              { tagline: { contains: filters.query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.startup.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.startup.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getBySlug(slug: string) {
    const startup = await this.prisma.startup.findUnique({ where: { slug }, include: { teamMembers: true } });
    if (!startup) throw new NotFoundException("Startup not found");
    return startup;
  }

  async create(ownerId: string, input: CreateStartupInput) {
    const slug = await this.generateUniqueSlug(input.name);
    return this.prisma.startup.create({ data: { ...input, ownerId, slug } });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 1;
    // Small tables today; revisit with a DB-level unique-with-retry if this ever contends under high write concurrency.
    while (await this.prisma.startup.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${++suffix}`;
    }
    return candidate;
  }
}
