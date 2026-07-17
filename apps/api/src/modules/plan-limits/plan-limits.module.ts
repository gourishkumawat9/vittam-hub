import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";

import { PlanLimitsService } from "./plan-limits.service";

@Module({
  imports: [AuditLogModule],
  providers: [PlanLimitsService],
  exports: [PlanLimitsService],
})
export class PlanLimitsModule {}
