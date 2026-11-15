import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ACCOUNT_THROTTLER, UserThrottlerGuard } from "../../common/guards/user-throttler.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { FollowsService } from "./follows.service";

@ApiTags("follows")
@Controller("v1/follows")
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get("me")
  @ApiOperation({ summary: "List users the caller is following" })
  listFollowing(@CurrentUser() user: AuthenticatedUser) {
    return this.followsService.listFollowing(user.sub);
  }

  @Get("me/followers")
  @ApiOperation({ summary: "List the caller's followers" })
  listFollowers(@CurrentUser() user: AuthenticatedUser) {
    return this.followsService.listFollowers(user.sub);
  }

  @Get(":userId")
  @ApiOperation({ summary: "Check whether the caller is following a given user" })
  isFollowing(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string) {
    return this.followsService.isFollowing(user.sub, userId);
  }

  @Post(":userId")
  @UseGuards(UserThrottlerGuard)
  @Throttle({ [ACCOUNT_THROTTLER]: { limit: 60, ttl: 60 * 60_000 } })
  @ApiOperation({ summary: "Follow a user" })
  follow(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string) {
    return this.followsService.follow(user.sub, userId);
  }

  @Delete(":userId")
  @ApiOperation({ summary: "Unfollow a user" })
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string) {
    return this.followsService.unfollow(user.sub, userId);
  }
}
