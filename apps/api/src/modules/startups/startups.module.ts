import { Module } from "@nestjs/common";

import { InvestorsModule } from "../investors/investors.module";

import { FounderActivityService } from "./founder-activity.service";
import { FounderAnalyticsService } from "./founder-analytics.service";
import { FounderReputationService } from "./founder-reputation.service";
import { MilestonesService } from "./milestones.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { ProfileViewsService } from "./profile-views.service";
import { StartupsController } from "./startups.controller";
import { StartupsService } from "./startups.service";
import { TrustScoreService } from "./trust-score.service";

@Module({
  imports: [InvestorsModule],
  controllers: [StartupsController],
  providers: [
    StartupsService,
    TrustScoreService,
    ProfileCompletionService,
    MilestonesService,
    FounderActivityService,
    ProfileViewsService,
    FounderReputationService,
    FounderAnalyticsService,
  ],
  exports: [StartupsService, TrustScoreService, ProfileCompletionService, FounderActivityService, FounderReputationService],
})
export class StartupsModule {}
