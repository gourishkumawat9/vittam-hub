import { Injectable } from "@nestjs/common";
import type { GlobalSearchFilters } from "@vittamhub/types";

import { HiringService } from "../hiring/hiring.service";
import { IncubatorsService } from "../incubators/incubators.service";
import { InvestorsService } from "../investors/investors.service";
import { MentorsService } from "../mentors/mentors.service";
import { StartupsService } from "../startups/startups.service";

const RESULTS_PER_GROUP = 5;

/**
 * Groups results from each domain's own list/search method — no separate
 * search index, just a fan-out over the same real data every directory page
 * already queries. `take: 5` per group keeps the dropdown fast; "See all
 * results" links back into each domain's own full search page.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly startupsService: StartupsService,
    private readonly investorsService: InvestorsService,
    private readonly mentorsService: MentorsService,
    private readonly incubatorsService: IncubatorsService,
    private readonly hiringService: HiringService,
  ) {}

  async search(filters: GlobalSearchFilters, callerId: string) {
    const paged = { query: filters.query, page: 1, pageSize: RESULTS_PER_GROUP };

    const [startups, investors, mentors, incubators, jobs] = await Promise.all([
      this.startupsService.search(paged, callerId),
      this.investorsService.list(paged, callerId),
      this.mentorsService.list(paged),
      this.incubatorsService.list(paged),
      this.hiringService.search(paged),
    ]);

    return {
      startups: startups.items,
      investors: investors.items,
      mentors: mentors.items,
      incubators: incubators.items,
      jobs: jobs.items,
    };
  }
}
