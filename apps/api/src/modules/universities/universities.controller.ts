import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { universitySearchFiltersSchema, type UniversitySearchFilters } from "@vittamhub/types";

import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

import { UniversitiesService } from "./universities.service";

@ApiTags("universities")
@Controller("v1/universities")
@Public()
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(universitySearchFiltersSchema))
  @ApiOperation({ summary: "Browse university/incubation-cell profiles, filterable by department/program" })
  list(@Query() filters: UniversitySearchFilters) {
    return this.universitiesService.list(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a public university profile" })
  getById(@Param("id") id: string) {
    return this.universitiesService.getById(id);
  }
}
