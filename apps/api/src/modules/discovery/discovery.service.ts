import { Injectable } from "@nestjs/common";
import { StartupSearchFilters } from "@vittamhub/types";

import { StartupsService } from "../startups/startups.service";

@Injectable()
export class DiscoveryService {
  constructor(private readonly startupsService: StartupsService) {}

  /**
   * Today: delegates straight to Postgres filtering. Next: swap in a search
   * index (Meilisearch/Algolia — see docs/07-backend-architecture.md
   * §Discovery) once relevance ranking needs typo-tolerance and vector
   * similarity ("startups like this one") beyond what SQL LIKE can do.
   */
  feedFor(_userId: string, filters: StartupSearchFilters) {
    return this.startupsService.search(filters);
  }
}
