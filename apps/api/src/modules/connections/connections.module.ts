import { Module } from "@nestjs/common";

import { PlanLimitsModule } from "../plan-limits/plan-limits.module";

import { ConnectionsController } from "./connections.controller";
import { ConnectionsService } from "./connections.service";

@Module({
  imports: [PlanLimitsModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
