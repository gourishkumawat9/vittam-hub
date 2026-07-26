import { Module } from "@nestjs/common";

import { CoInvestorGraphService } from "./co-investor-graph.service";
import { InvestorMetricsService } from "./investor-metrics.service";
import { InvestorTrustService } from "./investor-trust.service";
import { InvestorsController } from "./investors.controller";
import { InvestorsService } from "./investors.service";
import { MandatesController } from "./mandates.controller";
import { MandatesService } from "./mandates.service";
import { MatchScoreService } from "./match-score.service";

/** Mirrors StartupsModule's shape (search + get-by-id + create) — see docs/07-backend-architecture.md for the module template every domain follows. */
@Module({
  controllers: [InvestorsController, MandatesController],
  providers: [InvestorsService, MatchScoreService, InvestorMetricsService, InvestorTrustService, MandatesService, CoInvestorGraphService],
  exports: [InvestorsService, MatchScoreService, InvestorMetricsService, InvestorTrustService, MandatesService, CoInvestorGraphService],
})
export class InvestorsModule {}
