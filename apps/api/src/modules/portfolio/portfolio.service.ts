import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Read-only — Investment rows are only ever created by PipelineService when a deal reaches INVESTED. */
@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  listForInvestor(investorId: string) {
    return this.prisma.investment.findMany({
      where: { investorId },
      orderBy: { investedAt: "desc" },
      include: { startup: { include: { traction: true } } },
    });
  }
}
