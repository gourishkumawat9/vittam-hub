import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type { CreateStartupInput, Industry, StartupSearchFilters, UpdateStartupVisibilityInput } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset, slugify } from "@vittamhub/utils";

import { isDemoViewer } from "../../common/demo/demo-scope";
import { listableStartupWhere, projectStartups } from "../../common/startups/startup-visibility";
import { PrismaService } from "../../database/prisma/prisma.service";

/** Who is searching. Decides which rows come back and which filters they may use. */
export interface StartupSearchViewer {
  userId?: string | null;
  isInvestor: boolean;
}

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
   *
   * Returns raw rows, exact figures included. Nothing outside this module may
   * send them to a client: use `searchProjected`, which is this query plus the
   * public projection for the person asking.
   */
  async search(filters: StartupSearchFilters, callerId?: string | null, viewerIsInvestor = false) {
    let industry = filters.industry;
    let stage = filters.stage;

    if (filters.matchMyPreferences && callerId && (!industry?.length || !stage?.length)) {
      const investor = await this.prisma.investor.findUnique({ where: { ownerId: callerId } });
      if (investor) {
        industry ??= investor.preferredIndustries as Industry[];
        stage ??= investor.preferredStages;
      }
    }

    // Anyone browsing can widen the net beyond VERIFIED by passing an explicit
    // verificationStatus filter (e.g. an investor who wants to see PENDING
    // profiles too) — the default stays VERIFIED-only when nothing is passed.
    const verificationStatus = filters.verificationStatus?.length ? { in: filters.verificationStatus } : ("VERIFIED" as const);

    // Filtering on a figure is a way of reading it: "raising at least X" run a
    // few times pins down a funding goal the profile itself withholds. So the
    // money filters are for investors (who see those figures anyway), and never
    // match a startup that has hidden its numbers.
    const tractionWhere: Prisma.StartupTractionWhereInput = viewerIsInvestor
      ? {
          ...(filters.hasRevenue ? { monthlyRevenueAmount: { gt: 0 } } : {}),
          ...(filters.growthRateMin !== undefined ? { growthRatePercent: { gte: filters.growthRateMin } } : {}),
        }
      : {};
    const filtersOnTraction = Object.keys(tractionWhere).length > 0;
    const minFundingGoal = viewerIsInvestor ? filters.minFundingRequirementAmount : undefined;

    const viewerIsDemo = await isDemoViewer(this.prisma, callerId);
    const where: Prisma.StartupWhereInput = {
      // Public, not deleted, not private/stealth, and demo and real accounts
      // never see each other. INVESTOR_ONLY still needs the per-viewer check
      // (the role isn't known to a shared query) — see `searchProjected`.
      AND: [listableStartupWhere(viewerIsDemo), ...(filtersOnTraction ? [{ metricsVisibility: { not: "HIDDEN" as const } }] : [])],
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
      ...(minFundingGoal !== undefined ? { funding: { fundingGoalAmount: { gte: minFundingGoal } } } : {}),
      ...(filtersOnTraction ? { traction: tractionWhere } : {}),
      ...(filters.founderExperienceMin !== undefined
        ? { owner: { profile: { yearsOfExperience: { gte: filters.founderExperienceMin } } } }
        : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { tagline: { contains: filters.query, mode: "insensitive" } },
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

  /**
   * `search`, with every row passed through the public projection for the
   * person asking: investor-only profiles are dropped for everyone else, and
   * burn, valuation, the raise and exact revenue are banded or removed as the
   * founder chose. This is the only form of search results that may leave the
   * API — the global search and the discovery feed used to return `search`
   * as-is, exact figures and all, to any signed-in account.
   */
  async searchProjected(filters: StartupSearchFilters, viewer: StartupSearchViewer) {
    const result = await this.search(filters, viewer.userId, viewer.isInvestor);
    return { ...result, items: projectStartups(result.items, viewer) };
  }

  async getBySlug(slug: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { slug },
      include: { teamMembers: true, product: true, milestones: { orderBy: { achievedAt: "asc" } }, traction: true, funding: true },
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

  /** Bundle 30 — the founder's own "who can see this" and "how should my metrics show publicly" controls. */
  async updateVisibility(ownerId: string, input: UpdateStartupVisibilityInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId } });
    if (!startup) throw new NotFoundException("You haven't created a startup profile yet");
    return this.prisma.startup.update({ where: { ownerId }, data: input });
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
