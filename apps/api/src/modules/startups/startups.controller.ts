import { Body, Controller, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { createStartupInputSchema, startupSearchFiltersSchema, type CreateStartupInput, type StartupSearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { StartupsService } from "./startups.service";

@ApiTags("startups")
@Controller("v1/startups")
export class StartupsController {
  constructor(private readonly startupsService: StartupsService) {}

  @Public()
  @Get()
  @UsePipes(new ZodValidationPipe(startupSearchFiltersSchema))
  @ApiOperation({ summary: "Search verified, public startup profiles" })
  search(@Query() filters: StartupSearchFilters) {
    return this.startupsService.search(filters);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get a public startup profile by slug" })
  getBySlug(@Param("slug") slug: string) {
    return this.startupsService.getBySlug(slug);
  }

  @Post()
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createStartupInputSchema))
  @ApiOperation({ summary: "Create the caller's startup profile (one per founder)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateStartupInput) {
    return this.startupsService.create(user.sub, input);
  }
}
