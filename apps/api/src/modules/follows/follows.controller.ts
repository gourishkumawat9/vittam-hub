import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
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
