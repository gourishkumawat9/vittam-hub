import { Module } from "@nestjs/common";

import { InvestorMetricsService } from "./investor-metrics.service";
import { InvestorTrustService } from "./investor-trust.service";
import { InvestorsController } from "./investors.controller";
import { InvestorsService } from "./investors.service";
import { MatchScoreService } from "./match-score.service";

/** Mirrors StartupsModule's shape (search + get-by-id + create) — see docs/07-backend-architecture.md for the module template every domain follows. */
@Module({
  controllers: [InvestorsController],
  providers: [InvestorsService, MatchScoreService, InvestorMetricsService, InvestorTrustService],
  exports: [InvestorsService, MatchScoreService, InvestorMetricsService, InvestorTrustService],
})
export class InvestorsModule {}
