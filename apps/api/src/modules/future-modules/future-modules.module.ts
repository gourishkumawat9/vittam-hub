import { Module } from "@nestjs/common";

import { FutureModulesController } from "./future-modules.controller";
import { FutureModulesService } from "./future-modules.service";

@Module({
  controllers: [FutureModulesController],
  providers: [FutureModulesService],
})
export class FutureModulesModule {}
