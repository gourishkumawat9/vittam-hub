import { Controller, Get, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { globalSearchFiltersSchema, type GlobalSearchFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("v1/search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(globalSearchFiltersSchema))
  @ApiOperation({ summary: "Global cross-entity search — startups, investors, mentors, incubators, jobs, 5 results per group" })
  search(@CurrentUser() user: AuthenticatedUser, @Query() filters: GlobalSearchFilters) {
    return this.searchService.search(filters, user.sub);
  }
}
