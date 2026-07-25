import { Module } from "@nestjs/common";

import { InvestorsModule } from "../investors/investors.module";
import { TrustModule } from "../trust/trust.module";

import { BenchmarkService } from "./benchmark.service";
import { FounderActivityService } from "./founder-activity.service";
import { FounderAnalyticsService } from "./founder-analytics.service";
import { FounderReputationService } from "./founder-reputation.service";
import { FundingRoundsService } from "./funding-rounds.service";
import { MilestonesService } from "./milestones.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { ProfileViewsService } from "./profile-views.service";
import { StartupPublicProjectionService } from "./startup-public-projection.service";
import { StartupsController } from "./startups.controller";
import { StartupsService } from "./startups.service";
import { TractionService } from "./traction.service";
import { TrustScoreService } from "./trust-score.service";

@Module({
  imports: [InvestorsModule, TrustModule],
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
    TractionService,
    FundingRoundsService,
    StartupPublicProjectionService,
    BenchmarkService,
  ],
  exports: [
    StartupsService,
    TrustScoreService,
    ProfileCompletionService,
    FounderActivityService,
    FounderReputationService,
    TractionService,
    FundingRoundsService,
  ],
})
export class StartupsModule {}
