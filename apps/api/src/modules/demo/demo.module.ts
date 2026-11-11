import { Module } from "@nestjs/common";

import { DemoAccountsService } from "./demo-accounts.service";

@Module({
  providers: [DemoAccountsService],
})
export class DemoModule {}
