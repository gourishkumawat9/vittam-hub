import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  followStartupInputSchema,
  updateWatchlistEntryInputSchema,
  type FollowStartupInput,
  type UpdateWatchlistEntryInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { WatchlistService } from "./watchlist.service";

/** "Saved Startups" and "Watchlist" are both this same list, filtered by `notifyOnUpdate` — see WatchlistService. */
@ApiTags("watchlist")
@Controller("v1/watchlist")
@Roles("INVESTOR")
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

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
}
