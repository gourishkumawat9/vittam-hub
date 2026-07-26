import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createSavedSearchInputSchema,
  updateSavedSearchInputSchema,
  type CreateSavedSearchInput,
  type UpdateSavedSearchInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { SavedSearchesService } from "./saved-searches.service";

@ApiTags("investor-workspace")
@Controller("v1/investors/me/saved-searches")
@Roles("INVESTOR")
export class SavedSearchesController {
  constructor(private readonly savedSearches: SavedSearchesService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's saved searches, most recent first" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.savedSearches.listMine(user.sub);
  }

  @Post()
  @ApiOperation({ summary: "Save a discovery filter set — 'Seed SaaS India', 'Fintech Raising', etc." })
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createSavedSearchInputSchema)) input: CreateSavedSearchInput) {
    return this.savedSearches.create(user.sub, input);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a saved search's name, filters, or notification setting" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSavedSearchInputSchema)) input: UpdateSavedSearchInput,
  ) {
    return this.savedSearches.update(user.sub, id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a saved search" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savedSearches.remove(user.sub, id);
  }

  @Get(":id/run")
  @ApiOperation({ summary: "Re-run a saved search's filters through live discovery — 'every search automatically updates'" })
  run(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savedSearches.run(user.sub, id);
  }

  @Get(":id/new-count")
  @ApiOperation({ summary: "How many startups newly match this search since it was last opened" })
  newMatchesCount(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savedSearches.newMatchesCount(user.sub, id).then((count) => ({ count }));
  }

  @Post(":id/mark-viewed")
  @ApiOperation({ summary: "Mark a saved search as viewed, resetting its 'new matches' counter" })
  markViewed(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savedSearches.markViewed(user.sub, id);
  }
}
