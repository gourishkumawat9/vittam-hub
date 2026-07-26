import { Module } from "@nestjs/common";

import { StartupsModule } from "../startups/startups.module";

import { SavedSearchesController } from "./saved-searches.controller";
import { SavedSearchesService } from "./saved-searches.service";

// Deliberately its own module rather than folded into InvestorsModule:
// StartupsModule already imports InvestorsModule (for Trust/Match scoring on
// discovery results), so InvestorsModule importing StartupsModule back would
// create a cycle. This module only needs StartupsService, one direction.
@Module({
  imports: [StartupsModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
