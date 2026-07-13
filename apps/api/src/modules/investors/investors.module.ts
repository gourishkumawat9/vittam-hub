import { Module } from "@nestjs/common";

import { InvestorsController } from "./investors.controller";
import { InvestorsService } from "./investors.service";

/** Mirrors StartupsModule's shape (search + get-by-id + create) — see docs/07-backend-architecture.md for the module template every domain follows. */
@Module({
  controllers: [InvestorsController],
  providers: [InvestorsService],
  exports: [InvestorsService],
})
export class InvestorsModule {}
