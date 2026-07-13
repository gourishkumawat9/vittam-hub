import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateInvestorInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const investor = await this.prisma.investor.findUnique({ where: { id } });
    if (!investor) throw new NotFoundException("Investor not found");
    return investor;
  }

  create(ownerId: string, input: CreateInvestorInput) {
    return this.prisma.investor.create({ data: { ...input, ownerId } });
  }

  /**
   * Simple "browse investors" feed for founders deciding who to send a
   * Connect Request to. Deliberately basic (no ranking/pagination) — see
   * DiscoveryService for the equivalent, more fleshed-out startup-side search;
   * this can grow the same filter shape once investor-side discovery needs it.
   */
  list() {
    return this.prisma.investor.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { owner: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  // TODO: search() with the same filter shape as StartupsService.search once
  // discovery-module ranking logic (docs/07-backend-architecture.md §Discovery) lands.
}
