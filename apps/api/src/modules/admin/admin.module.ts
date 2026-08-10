import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { EMAIL_QUEUE_NAME } from "../jobs/email-queue.constants";
import { PlanLimitsModule } from "../plan-limits/plan-limits.module";

import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PlatformAnalyticsService } from "./platform-analytics.service";
import { SystemHealthService } from "./system-health.service";

@Module({
  // The email queue is registered here so SystemHealthService can reach the
  // shared Redis connection to probe it — registerQueue resolves to the same
  // underlying queue instance, it does not create a second one.
  imports: [PlanLimitsModule, BullModule.registerQueue({ name: EMAIL_QUEUE_NAME })],
  controllers: [AdminController],
  providers: [AdminService, PlatformAnalyticsService, SystemHealthService],
})
export class AdminModule {}
