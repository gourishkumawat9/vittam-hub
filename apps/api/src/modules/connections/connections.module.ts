import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";
import { MediaModule } from "../media/media.module";
import { PlanLimitsModule } from "../plan-limits/plan-limits.module";

import { ConnectionsController } from "./connections.controller";
import { ConnectionsService } from "./connections.service";

@Module({
  imports: [PlanLimitsModule, AuditLogModule, MediaModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
