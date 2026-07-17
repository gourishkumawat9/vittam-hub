import { Module } from "@nestjs/common";

import { InvestorsModule } from "../investors/investors.module";
import { StartupsModule } from "../startups/startups.module";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [InvestorsModule, StartupsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RecommendationsService],
})
export class AnalyticsModule {}
