import { Module } from "@nestjs/common";

import { HiringModule } from "../hiring/hiring.module";
import { IncubatorsModule } from "../incubators/incubators.module";
import { InvestorsModule } from "../investors/investors.module";
import { MentorsModule } from "../mentors/mentors.module";
import { StartupsModule } from "../startups/startups.module";

import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  imports: [StartupsModule, InvestorsModule, MentorsModule, IncubatorsModule, HiringModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
