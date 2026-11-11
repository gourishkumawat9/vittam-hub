import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { incubatorSearchFiltersSchema, type IncubatorSearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { IncubatorsService } from "./incubators.service";

@ApiTags("incubators")
@Controller("v1/incubators")
@Public()
export class IncubatorsController {
  constructor(private readonly incubatorsService: IncubatorsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(incubatorSearchFiltersSchema))
  @ApiOperation({ summary: "Browse incubator profiles and their programs, filterable by industry" })
  list(@CurrentUser() user: AuthenticatedUser | null, @Query() filters: IncubatorSearchFilters) {
    return this.incubatorsService.list(filters, user?.sub);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a public incubator profile, including its programs" })
  getById(@Param("id") id: string) {
    return this.incubatorsService.getById(id);
  }
}
