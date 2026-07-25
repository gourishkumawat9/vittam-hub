import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma/prisma.module";

import { TrustEngineService } from "./trust-engine.service";
import { TRUST_RECOMPUTE_QUEUE_NAME } from "./trust-recompute.constants";
import { TrustRecomputeProcessor } from "./trust-recompute.processor";
import { TrustRecomputeService } from "./trust-recompute.service";

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: TRUST_RECOMPUTE_QUEUE_NAME })],
  providers: [TrustEngineService, TrustRecomputeService, TrustRecomputeProcessor],
  exports: [TrustEngineService, TrustRecomputeService],
})
export class TrustModule {}
