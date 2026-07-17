import { Module } from "@nestjs/common";

import { PlanLimitsModule } from "../plan-limits/plan-limits.module";

import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PlatformAnalyticsService } from "./platform-analytics.service";

@Module({
  imports: [PlanLimitsModule],
  controllers: [AdminController],
  providers: [AdminService, PlatformAnalyticsService],
})
export class AdminModule {}
