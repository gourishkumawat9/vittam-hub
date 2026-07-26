import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createWatchlistTriggerInputSchema,
  followStartupInputSchema,
  updateWatchlistEntryInputSchema,
  type CreateWatchlistTriggerInput,
  type FollowStartupInput,
  type UpdateWatchlistEntryInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { WatchlistTriggersService } from "./watchlist-triggers.service";
import { WatchlistService } from "./watchlist.service";

/** "Saved Startups" and "Watchlist" are both this same list, filtered by `notifyOnUpdate` — see WatchlistService. */
@ApiTags("watchlist")
@Controller("v1/watchlist")
@Roles("INVESTOR")
export class WatchlistController {
  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly triggersService: WatchlistTriggersService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's saved/watchlisted startups" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.watchlistService.listForInvestor(user.sub);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(followStartupInputSchema))
  @ApiOperation({ summary: "Save a startup, optionally subscribing to its update notifications" })
  follow(@CurrentUser() user: AuthenticatedUser, @Body() input: FollowStartupInput) {
    return this.watchlistService.follow(user.sub, input);
  }

  @Delete(":startupId")
  @ApiOperation({ summary: "Remove a startup from the caller's saved/watchlist" })
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param("startupId") startupId: string) {
    return this.watchlistService.unfollow(user.sub, startupId);
  }

  @Patch(":startupId")
  @UsePipes(new ZodValidationPipe(updateWatchlistEntryInputSchema))
  @ApiOperation({ summary: "Update notes/list name for a saved startup" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("startupId") startupId: string,
    @Body() input: UpdateWatchlistEntryInput,
  ) {
    return this.watchlistService.update(user.sub, startupId, input);
  }

  @Get("triggers")
  @ApiOperation({ summary: "List the caller's watchlist triggers ('notify me when...')" })
  listTriggers(@CurrentUser() user: AuthenticatedUser) {
    return this.triggersService.listForInvestor(user.sub);
  }

  @Post("triggers")
  @UsePipes(new ZodValidationPipe(createWatchlistTriggerInputSchema))
  @ApiOperation({ summary: "Create a watchlist trigger — evaluated hourly, fires a real notification once its condition is met" })
  createTrigger(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateWatchlistTriggerInput) {
    return this.triggersService.create(user.sub, input);
  }

  @Delete("triggers/:id")
  @ApiOperation({ summary: "Delete a watchlist trigger" })
  removeTrigger(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.triggersService.remove(user.sub, id);
  }
}
