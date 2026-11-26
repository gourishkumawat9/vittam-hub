import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { universitySearchFiltersSchema, type UniversitySearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { UniversitiesService } from "./universities.service";

@ApiTags("universities")
@Controller("v1/universities")
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Public()
  @Get()
  @UsePipes(new ZodValidationPipe(universitySearchFiltersSchema))
  @ApiOperation({ summary: "Browse university/incubation-cell profiles, filterable by department/program" })
  list(@CurrentUser() user: AuthenticatedUser | null, @Query() filters: UniversitySearchFilters) {
    return this.universitiesService.list(filters, user?.sub);
  }

  @Get("me")
  @Roles("UNIVERSITY")
  @ApiOperation({ summary: "The signed-in university's own profile, for the university home. Null before the profile is published" })
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.universitiesService.getMine(user.sub);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a public university profile" })
  getById(@Param("id") id: string) {
    return this.universitiesService.getById(id);
  }
}
