import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type { CreateInvestorInput, InvestorSearchFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class InvestorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getById(id: string) {
    const investor = await this.prisma.investor.findUnique({ where: { id } });
    if (!investor) throw new NotFoundException("Investor not found");
    return investor;
  }

  async create(ownerId: string, input: CreateInvestorInput) {
    const investor = await this.prisma.investor.create({ data: { ...input, ownerId } });
    this.eventEmitter.emit("profile.upserted", { ownerId });
    return investor;
  }

  async getMine(ownerId: string) {
    const investor = await this.prisma.investor.findUnique({ where: { ownerId } });
    if (!investor) throw new NotFoundException("You haven't created an investor profile yet");
    return investor;
  }

  async update(ownerId: string, input: Partial<CreateInvestorInput>) {
    const investor = await this.prisma.investor.update({ where: { ownerId }, data: input });
    this.eventEmitter.emit("profile.upserted", { ownerId });
    return investor;
  }

  /**
   * Founder-facing investor discovery. When `matchMyStartup` is set and the
   * caller hasn't already picked an explicit industry/stage, defaults those
   * filters to the caller's own startup — "only display investors matching
   * the startup whenever possible," per the product brief, without forcing
   * that as the only way to browse.
   */
  async list(filters: InvestorSearchFilters, callerId: string) {
    let industry = filters.industry;
    let stage = filters.stage;

    if (filters.matchMyStartup && (!industry?.length || !stage?.length)) {
      const myStartup = await this.prisma.startup.findUnique({ where: { ownerId: callerId } });
      if (myStartup) {
        industry ??= [myStartup.industry];
        stage ??= [myStartup.stage];
      }
    }

    const where: Prisma.InvestorWhereInput = {
      isPublic: true,
      ...(industry?.length ? { preferredIndustries: { hasSome: industry } } : {}),
      ...(filters.country?.length ? { preferredGeography: { hasSome: filters.country } } : {}),
      ...(stage?.length ? { preferredStages: { hasSome: stage } } : {}),
      ...(filters.investorType?.length ? { investorType: { in: filters.investorType } } : {}),
      ...(filters.minTicketSizeUsd !== undefined ? { checkSizeMaxUsd: { gte: filters.minTicketSizeUsd } } : {}),
      ...(filters.portfolioCompanies?.length ? { portfolioCompanies: { hasSome: filters.portfolioCompanies } } : {}),
      ...(filters.query
        ? {
            OR: [
              { firmName: { contains: filters.query, mode: "insensitive" } },
              { bio: { contains: filters.query, mode: "insensitive" } },
              { owner: { fullName: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.investor.findMany({
        where,
        skip,
        take,
        orderBy: { [filters.sortBy ?? "createdAt"]: filters.sortDir ?? "desc" },
        include: { owner: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.investor.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }
}
