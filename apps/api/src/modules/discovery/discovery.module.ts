import { Module } from "@nestjs/common";

import { StartupsModule } from "../startups/startups.module";

import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";

/**
 * Cross-entity discovery/ranking surface (the investor home feed, "startups
 * like this one," search-as-you-type). Deliberately separate from
 * StartupsModule/InvestorsModule CRUD so ranking logic and a future
 * Meilisearch/Algolia index can evolve independently of the write path.
 */
@Module({
  imports: [StartupsModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
