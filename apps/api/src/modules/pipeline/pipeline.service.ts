import { Injectable, NotFoundException } from "@nestjs/common";
import type { AddToPipelineInput, PassStartupInput, UpdatePipelineEntryInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * One row per (investor, startup) being evaluated — the Kanban board is just
 * this table grouped by `stage`. Reaching CLOSED (closed-won) atomically
 * creates the matching Investment (portfolio) row in the same transaction;
 * PASSED is a real terminal stage with a structured reason (see `pass()`),
 * never a silent delete.
 */
@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  listForInvestor(investorId: string) {
    return this.prisma.pipelineEntry.findMany({
      where: { investorId },
      orderBy: { updatedAt: "desc" },
      include: { startup: { include: { traction: true, funding: true } } },
    });
  }

  async addToPipeline(investorId: string, input: AddToPipelineInput) {
    const startup = await this.prisma.startup.findUnique({ where: { id: input.startupId } });
    if (!startup) throw new NotFoundException("Startup not found");

    return this.prisma.pipelineEntry.upsert({
      where: { investorId_startupId: { investorId, startupId: input.startupId } },
      create: { investorId, startupId: input.startupId, stage: input.stage, mandateId: input.mandateId },
      update: { stage: input.stage, ...(input.mandateId ? { mandateId: input.mandateId } : {}) },
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

      // Moving a card to CLOSED (closed-won) is what actually creates the portfolio holding.
      if (input.stage === "CLOSED") {
        await tx.investment.upsert({
          where: { investorId_startupId: { investorId, startupId: entry.startupId } },
          create: { investorId, startupId: entry.startupId },
          update: {},
        });
      }

      return updated;
    });
  }

  /** "NEVER simply record Passed — require a structured reason" (Investor Workspace §7). The only way a card reaches PASSED. */
  async pass(investorId: string, entryId: string, input: PassStartupInput) {
    const entry = await this.prisma.pipelineEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.investorId !== investorId) throw new NotFoundException("Pipeline entry not found");

    return this.prisma.pipelineEntry.update({
      where: { id: entryId },
      data: { stage: "PASSED", passReason: input.reason, passNote: input.note, passedAt: new Date() },
    });
  }

  async removeEntry(investorId: string, entryId: string) {
    const entry = await this.prisma.pipelineEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.investorId !== investorId) throw new NotFoundException("Pipeline entry not found");
    return this.prisma.pipelineEntry.delete({ where: { id: entryId } });
  }
}
