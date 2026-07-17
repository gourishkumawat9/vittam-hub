import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type { CreateStartupInput, StartupSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset, slugify } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class StartupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * The Discover Startups query layer — shared by founders' public discovery
   * and the investor portal's advanced filters/smart search. `matchMyPreferences`
   * defaults industry/stage to the caller's own Investor preferences when
   * neither is explicitly set, same pattern as InvestorsService.list's
   * `matchMyStartup`. See docs/14-investor-portal.md.
   */
  async search(filters: StartupSearchFilters, callerId?: string) {
    let industry = filters.industry;
    let stage = filters.stage;

    if (filters.matchMyPreferences && callerId && (!industry?.length || !stage?.length)) {
      const investor = await this.prisma.investor.findUnique({ where: { ownerId: callerId } });
      if (investor) {
        industry ??= investor.preferredIndustries;
        stage ??= investor.preferredStages;
      }
    }

    // Anyone browsing can widen the net beyond VERIFIED by passing an explicit
    // verificationStatus filter (e.g. an investor who wants to see PENDING
    // profiles too) — the default stays VERIFIED-only when nothing is passed.
    const verificationStatus = filters.verificationStatus?.length ? { in: filters.verificationStatus } : ("VERIFIED" as const);

    const tractionWhere: Prisma.StartupTractionWhereInput = {
      ...(filters.hasRevenue ? { monthlyRevenueUsd: { gt: 0 } } : {}),
      ...(filters.growthRateMin !== undefined ? { growthRatePercent: { gte: filters.growthRateMin } } : {}),
    };

    const where: Prisma.StartupWhereInput = {
      isPublic: true,
      verificationStatus,
      ...(industry?.length ? { industry: { in: industry } } : {}),
      ...(stage?.length ? { stage: { in: stage } } : {}),
      ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {}),
      ...(filters.isFundraising !== undefined ? { isFundraising: filters.isFundraising } : {}),
      ...(filters.foundedYearMin !== undefined || filters.foundedYearMax !== undefined
        ? { foundedYear: { gte: filters.foundedYearMin, lte: filters.foundedYearMax } }
        : {}),
      ...(filters.teamSizeMin !== undefined || filters.teamSizeMax !== undefined
        ? { teamSize: { gte: filters.teamSizeMin, lte: filters.teamSizeMax } }
        : {}),
      ...(filters.businessModel?.length ? { market: { customerModel: { hasSome: filters.businessModel } } } : {}),
      ...(filters.technology?.length ? { product: { technologyStack: { hasSome: filters.technology } } } : {}),
      ...(filters.minFundingRequirementUsd !== undefined
        ? { funding: { fundingGoalUsd: { gte: filters.minFundingRequirementUsd } } }
        : {}),
      ...(Object.keys(tractionWhere).length ? { traction: tractionWhere } : {}),
      ...(filters.founderExperienceMin !== undefined
        ? { owner: { profile: { yearsOfExperience: { gte: filters.founderExperienceMin } } } }
        : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { tagline: { contains: filters.query, mode: "insensitive" } },
              { industry: { contains: filters.query, mode: "insensitive" } },
              { owner: { fullName: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.startup.findMany({
        where,
        skip,
        take,
        orderBy: { [filters.sortBy ?? "createdAt"]: filters.sortDir ?? "desc" },
        include: { funding: true, traction: true, owner: { select: { fullName: true } } },
      }),
      this.prisma.startup.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async getBySlug(slug: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { slug },
      include: { teamMembers: true, product: true, milestones: { orderBy: { achievedAt: "asc" } } },
    });
    if (!startup) throw new NotFoundException("Startup not found");
    return startup;
  }

  async getMine(ownerId: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { ownerId },
      include: { teamMembers: true, product: true, milestones: { orderBy: { achievedAt: "asc" } } },
    });
    if (!startup) throw new NotFoundException("You haven't created a startup profile yet");
    return startup;
  }

  async create(ownerId: string, input: CreateStartupInput) {
    const slug = await this.generateUniqueSlug(input.name);
    const startup = await this.prisma.startup.create({ data: { ...input, ownerId, slug } });
    this.eventEmitter.emit("profile.upserted", { ownerId });
    return startup;
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
