import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { incubatorSearchFiltersSchema, type IncubatorSearchFilters } from "@vittamhub/types";

import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

import { IncubatorsService } from "./incubators.service";

@ApiTags("incubators")
@Controller("v1/incubators")
@Public()
export class IncubatorsController {
  constructor(private readonly incubatorsService: IncubatorsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(incubatorSearchFiltersSchema))
  @ApiOperation({ summary: "Browse incubator profiles and their programs, filterable by industry" })
  list(@Query() filters: IncubatorSearchFilters) {
    return this.incubatorsService.list(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a public incubator profile, including its programs" })
  getById(@Param("id") id: string) {
    return this.incubatorsService.getById(id);
  }
}
