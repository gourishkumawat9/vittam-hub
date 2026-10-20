import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  castDiscussionVoteInputSchema,
  communitySlugToIndustry,
  createDiscussionInputSchema,
  createDiscussionReplyInputSchema,
  discussionListFiltersSchema,
  markSolutionInputSchema,
  type CastDiscussionVoteInput,
  type CreateDiscussionInput,
  type CreateDiscussionReplyInput,
  type DiscussionListFilters,
  type Industry,
  type MarkSolutionInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { CommunitiesService } from "./communities.service";
import { DiscussionsService } from "./discussions.service";

function industryFromSlug(slug: string): Industry {
  const industry = communitySlugToIndustry(slug);
  if (!industry) throw new BadRequestException(`Unknown community "${slug}"`);
  return industry;
}

/**
 * Domain communities (Reddit-style). Every route requires a signed-in user —
 * the global JwtAuthGuard applies, no @Public() here.
 */
@ApiTags("communities")
@Controller("v1")
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly discussionsService: DiscussionsService,
  ) {}

  @Get("communities")
  @ApiOperation({ summary: "Every domain community with member/discussion counts and whether the caller has joined" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.communitiesService.list(user.sub);
  }

  @Get("communities/:slug")
  @ApiOperation({ summary: "One domain community" })
  get(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.communitiesService.get(user.sub, industryFromSlug(slug));
  }

  @Post("communities/:slug/join")
  @ApiOperation({ summary: "Join a community" })
  join(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.communitiesService.join(user.sub, industryFromSlug(slug));
  }

  @Delete("communities/:slug/join")
  @ApiOperation({ summary: "Leave a community" })
  leave(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.communitiesService.leave(user.sub, industryFromSlug(slug));
  }

  @Get("discussions")
  @UsePipes(new ZodValidationPipe(discussionListFiltersSchema))
  @ApiOperation({ summary: "List discussions in one community, the caller's joined communities, or everywhere" })
  listDiscussions(@CurrentUser() user: AuthenticatedUser, @Query() filters: DiscussionListFilters) {
    return this.discussionsService.list(user.sub, filters);
  }

  @Post("discussions")
  @UsePipes(new ZodValidationPipe(createDiscussionInputSchema))
  @ApiOperation({ summary: "Ask a question or start a discussion in a community" })
  createDiscussion(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateDiscussionInput) {
    return this.discussionsService.create(user.sub, input);
  }

  @Get("discussions/:id")
  @ApiOperation({ summary: "A discussion with its replies (accepted solution first)" })
  getDiscussion(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.discussionsService.get(user.sub, id);
  }

  @Delete("discussions/:id")
  @ApiOperation({ summary: "Delete your own discussion (admins can delete any)" })
  removeDiscussion(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.discussionsService.remove(user, id);
  }

  @Post("discussions/:id/replies")
  @UsePipes(new ZodValidationPipe(createDiscussionReplyInputSchema))
  @ApiOperation({ summary: "Reply to a discussion" })
  reply(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() input: CreateDiscussionReplyInput) {
    return this.discussionsService.reply(user.sub, id, input);
  }

  @Delete("discussion-replies/:id")
  @ApiOperation({ summary: "Delete your own reply (admins can delete any)" })
  removeReply(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.discussionsService.removeReply(user, id);
  }

  @Post("discussions/:id/solution")
  @UsePipes(new ZodValidationPipe(markSolutionInputSchema))
  @ApiOperation({ summary: "Mark (or clear) the reply that solved your question" })
  markSolution(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() input: MarkSolutionInput) {
    return this.discussionsService.markSolution(user.sub, id, input);
  }

  @Post("discussions/:id/vote")
  @UsePipes(new ZodValidationPipe(castDiscussionVoteInputSchema))
  @ApiOperation({ summary: "Upvote (1), downvote (-1) or clear (0) your vote on a discussion" })
  voteDiscussion(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() input: CastDiscussionVoteInput) {
    return this.discussionsService.voteOnDiscussion(user.sub, id, input.value);
  }

  @Post("discussion-replies/:id/vote")
  @UsePipes(new ZodValidationPipe(castDiscussionVoteInputSchema))
  @ApiOperation({ summary: "Upvote (1), downvote (-1) or clear (0) your vote on a reply" })
  voteReply(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() input: CastDiscussionVoteInput) {
    return this.discussionsService.voteOnReply(user.sub, id, input.value);
  }
}
