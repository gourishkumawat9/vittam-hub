import { Injectable, NotFoundException } from "@nestjs/common";
import type { AddToPipelineInput, UpdatePipelineEntryInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * One row per (investor, startup) being evaluated — the Kanban board is just
 * this table grouped by `stage`. Reaching INVESTED atomically creates the
 * matching Investment (portfolio) row in the same transaction.
 */
@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  listForInvestor(investorId: string) {
    return this.prisma.pipelineEntry.findMany({
      where: { investorId },
      orderBy: { updatedAt: "desc" },
      include: { startup: true },
    });
  }

  async addToPipeline(investorId: string, input: AddToPipelineInput) {
    const startup = await this.prisma.startup.findUnique({ where: { id: input.startupId } });
    if (!startup) throw new NotFoundException("Startup not found");

    return this.prisma.pipelineEntry.upsert({
      where: { investorId_startupId: { investorId, startupId: input.startupId } },
      create: { investorId, startupId: input.startupId, stage: input.stage },
      update: { stage: input.stage },
    });
  }

  async updateEntry(investorId: string, entryId: string, input: UpdatePipelineEntryInput) {
    const entry = await this.prisma.pipelineEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.investorId !== investorId) throw new NotFoundException("Pipeline entry not found");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.pipelineEntry.update({
        where: { id: entryId },
        data: { stage: input.stage, notes: input.notes },
      });

      // Moving a card into INVESTED is what actually creates the portfolio holding.
      if (input.stage === "INVESTED") {
        await tx.investment.upsert({
          where: { investorId_startupId: { investorId, startupId: entry.startupId } },
          create: { investorId, startupId: entry.startupId },
          update: {},
        });
      }

      return updated;
    });
  }

  async removeEntry(investorId: string, entryId: string) {
    const entry = await this.prisma.pipelineEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.investorId !== investorId) throw new NotFoundException("Pipeline entry not found");
    return this.prisma.pipelineEntry.delete({ where: { id: entryId } });
  }
}
