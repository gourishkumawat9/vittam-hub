import { Module } from "@nestjs/common";

import { CommunitiesController } from "./communities.controller";
import { CommunitiesService } from "./communities.service";
import { DiscussionsService } from "./discussions.service";

@Module({
  controllers: [CommunitiesController],
  providers: [CommunitiesService, DiscussionsService],
})
export class CommunitiesModule {}
