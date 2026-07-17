import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { AnalyticsService } from "./analytics.service";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("analytics")
@Controller("v1")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get("analytics")
  @Roles("INVESTOR")
  @ApiOperation({ summary: "Portfolio/pipeline analytics computed from the caller's real activity" })
  getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getForInvestor(user.sub);
  }

  @Get("recommendations")
  @Roles("INVESTOR", "FOUNDER")
  @ApiOperation({
    summary:
      "Rule-based recommendations (not machine-learned) — startups for investors, investors for founders — see RecommendationsService",
  })
  getRecommendations(@CurrentUser() user: AuthenticatedUser) {
    return user.role === "FOUNDER"
      ? this.recommendationsService.getForFounder(user.sub)
      : this.recommendationsService.getForInvestor(user.sub);
  }
}
