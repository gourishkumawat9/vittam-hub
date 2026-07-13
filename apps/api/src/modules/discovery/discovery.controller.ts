import { Controller, Get, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { startupSearchFiltersSchema, type StartupSearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { DiscoveryService } from "./discovery.service";

@ApiTags("discovery")
@Controller("v1/discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get("feed")
  @UsePipes(new ZodValidationPipe(startupSearchFiltersSchema))
  @ApiOperation({ summary: "Personalized startup discovery feed for the current investor" })
  feed(@CurrentUser() user: AuthenticatedUser, @Query() filters: StartupSearchFilters) {
    return this.discoveryService.feedFor(user.sub, filters);
  }
}
