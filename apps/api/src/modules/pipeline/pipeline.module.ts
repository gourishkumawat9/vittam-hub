import { Module } from "@nestjs/common";

import { InvestorsModule } from "../investors/investors.module";
import { StartupsModule } from "../startups/startups.module";

import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";

@Module({
  imports: [StartupsModule, InvestorsModule],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
