import { Body, Controller, Delete, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  communityFeedFiltersSchema,
  createCommentInputSchema,
  createPostInputSchema,
  type CommunityFeedFilters,
  type CreateCommentInput,
  type CreatePostInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { BookmarksService } from "./bookmarks.service";
import { CommentsService } from "./comments.service";
import { EventsService } from "./events.service";
import { LikesService } from "./likes.service";
import { PollsService } from "./polls.service";
import { PostsService } from "./posts.service";

@ApiTags("community")
@Controller("v1/community")
export class CommunityController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly pollsService: PollsService,
    private readonly eventsService: EventsService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  @Get("feed")
  @UsePipes(new ZodValidationPipe(communityFeedFiltersSchema))
  @ApiOperation({ summary: "Community feed — founder posts, startup updates, announcements, polls, events" })
  feed(@CurrentUser() user: AuthenticatedUser, @Query() filters: CommunityFeedFilters) {
    return this.postsService.feed(filters, user.sub);
  }

  @Post("posts")
  @UsePipes(new ZodValidationPipe(createPostInputSchema))
  @ApiOperation({ summary: "Create a post (founders post updates, admins post announcements)" })
  createPost(@CurrentUser() user: AuthenticatedUser, @Body() input: CreatePostInput) {
    return this.postsService.create(user.sub, user.role, input);
  }

  @Delete("posts/:id")
  @ApiOperation({ summary: "Delete one of the caller's own posts" })
  removePost(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.postsService.remove(user.sub, id);
  }

  @Get("posts/:id/comments")
  @ApiOperation({ summary: "List a post's comments" })
  listComments(@Param("id") id: string) {
    return this.commentsService.list(id);
  }

  @Post("posts/:id/comments")
  @UsePipes(new ZodValidationPipe(createCommentInputSchema))
  @ApiOperation({ summary: "Comment on a post" })
  addComment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateCommentInput) {
    return this.commentsService.create(user.sub, id, input);
  }

  @Post("posts/:id/like")
  @ApiOperation({ summary: "Toggle a like on a post" })
  likePost(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.likesService.toggle(user.sub, { postId: id });
  }

  @Post("comments/:id/like")
  @ApiOperation({ summary: "Toggle a like on a comment" })
  likeComment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.likesService.toggle(user.sub, { commentId: id });
  }

  @Post("polls/:optionId/vote")
  @ApiOperation({ summary: "Vote for a poll option (one vote per poll per user)" })
  vote(@CurrentUser() user: AuthenticatedUser, @Param("optionId") optionId: string) {
    return this.pollsService.vote(user.sub, optionId);
  }

  @Post("posts/:id/rsvp")
  @ApiOperation({ summary: "RSVP to an event post" })
  rsvp(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.eventsService.rsvp(user.sub, id);
  }

  @Delete("posts/:id/rsvp")
  @ApiOperation({ summary: "Cancel an RSVP" })
  cancelRsvp(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.eventsService.cancelRsvp(user.sub, id);
  }

  @Post("posts/:id/bookmark")
  @ApiOperation({ summary: "Toggle a bookmark on a post" })
  bookmarkPost(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.bookmarksService.toggle(user.sub, id);
  }
}
