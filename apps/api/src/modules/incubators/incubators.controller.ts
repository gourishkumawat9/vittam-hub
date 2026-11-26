import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { incubatorSearchFiltersSchema, type IncubatorSearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { IncubatorsService } from "./incubators.service";

@ApiTags("incubators")
@Controller("v1/incubators")
export class IncubatorsController {
  constructor(private readonly incubatorsService: IncubatorsService) {}

  @Public()
  @Get()
  @UsePipes(new ZodValidationPipe(incubatorSearchFiltersSchema))
  @ApiOperation({ summary: "Browse incubator profiles and their programs, filterable by industry" })
  list(@CurrentUser() user: AuthenticatedUser | null, @Query() filters: IncubatorSearchFilters) {
    return this.incubatorsService.list(filters, user?.sub);
  }

  @Get("me")
  @Roles("INCUBATOR")
  @ApiOperation({ summary: "The signed-in incubator's own profile with its programs, for the incubator home. Null before the profile is published" })
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.incubatorsService.getMine(user.sub);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a public incubator profile, including its programs" })
  getById(@Param("id") id: string) {
    return this.incubatorsService.getById(id);
  }
}
