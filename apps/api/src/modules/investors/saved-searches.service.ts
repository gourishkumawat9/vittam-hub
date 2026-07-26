import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateSavedSearchInput, StartupSearchFilters, UpdateSavedSearchInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { StartupsService } from "../startups/startups.service";

const PREVIEW_PAGE_SIZE = 50; // StartupSearchFilters caps pageSize at 50 — "new matches" beyond this page is a documented lower bound, not exact.

/**
 * "Every search automatically updates" (Investor Workspace §5) — re-running
 * a saved search is just replaying its stored filters through
 * StartupsService.search, the same discovery query every other surface
 * uses. No parallel search implementation.
 */
@Injectable()
export class SavedSearchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly startupsService: StartupsService,
  ) {}

  listMine(investorId: string) {
    return this.prisma.savedSearch.findMany({ where: { investorId }, orderBy: { createdAt: "desc" } });
  }

  create(investorId: string, input: CreateSavedSearchInput) {
    return this.prisma.savedSearch.create({
      data: { investorId, name: input.name, notify: input.notify, filters: input.filters },
    });
  }

  private async assertOwned(investorId: string, id: string) {
    const saved = await this.prisma.savedSearch.findUnique({ where: { id } });
    if (!saved || saved.investorId !== investorId) throw new NotFoundException("Saved search not found");
    return saved;
  }

  async update(investorId: string, id: string, input: UpdateSavedSearchInput) {
    await this.assertOwned(investorId, id);
    return this.prisma.savedSearch.update({
      where: { id },
      data: { ...(input.name ? { name: input.name } : {}), ...(input.notify !== undefined ? { notify: input.notify } : {}), ...(input.filters ? { filters: input.filters } : {}) },
    });
  }

  async remove(investorId: string, id: string) {
    await this.assertOwned(investorId, id);
    return this.prisma.savedSearch.delete({ where: { id } });
  }

  /** Re-runs the stored filters through the real discovery query — same results a manual search with those filters would produce. */
  async run(investorId: string, id: string) {
    const saved = await this.assertOwned(investorId, id);
    const filters = { ...(saved.filters as object), page: 1, pageSize: PREVIEW_PAGE_SIZE } as StartupSearchFilters;
    return this.startupsService.search(filters, investorId);
  }

  /** "Number of new startups matching" since the investor last opened this search. */
  async newMatchesCount(investorId: string, id: string): Promise<number> {
    const saved = await this.assertOwned(investorId, id);
    const filters = { ...(saved.filters as object), page: 1, pageSize: PREVIEW_PAGE_SIZE } as StartupSearchFilters;
    const result = await this.startupsService.search(filters, investorId);
    return result.items.filter((item) => item.publishedAt && new Date(item.publishedAt) > saved.lastViewedAt).length;
  }

  async markViewed(investorId: string, id: string) {
    await this.assertOwned(investorId, id);
    return this.prisma.savedSearch.update({ where: { id }, data: { lastViewedAt: new Date() } });
  }
}
