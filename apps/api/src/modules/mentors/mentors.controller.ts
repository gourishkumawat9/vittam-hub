import { Body, Controller, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createFounderReviewInputSchema,
  createMentorBookingInputSchema,
  createMentorReviewInputSchema,
  mentorSearchFiltersSchema,
  respondToMentorBookingInputSchema,
  type CreateFounderReviewInput,
  type CreateMentorBookingInput,
  type CreateMentorReviewInput,
  type MentorSearchFilters,
  type RespondToMentorBookingInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { FounderReviewsService } from "./founder-reviews.service";
import { MentorBookingService } from "./mentor-booking.service";
import { MentorReputationService } from "./mentor-reputation.service";
import { MentorReviewsService } from "./mentor-reviews.service";
import { MentorsService } from "./mentors.service";

@ApiTags("mentors")
@Controller("v1/mentors")
export class MentorsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly bookingService: MentorBookingService,
    private readonly founderReviewsService: FounderReviewsService,
    private readonly mentorReviewsService: MentorReviewsService,
    private readonly mentorReputationService: MentorReputationService,
  ) {}

  @Public()
  @Get()
  @UsePipes(new ZodValidationPipe(mentorSearchFiltersSchema))
  @ApiOperation({ summary: "Browse mentor profiles, filterable by expertise/industry/session type" })
  async list(@Query() filters: MentorSearchFilters) {
    const result = await this.mentorsService.list(filters);
    const reputationById = await this.mentorReputationService.calculateMany(result.items.map((mentor) => mentor.ownerId));
    const items = result.items.map((mentor) => ({ ...mentor, reputation: reputationById.get(mentor.ownerId) ?? null }));
    return { ...result, items };
  }

  @Get("bookings")
  @ApiOperation({ summary: "List the caller's own mentor booking requests, sent or received" })
  listBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.listForUser(user.sub);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a public mentor profile, including reputation (average rating + sessions completed)" })
  async getById(@Param("id") id: string) {
    const mentor = await this.mentorsService.getById(id);
    const reputation = await this.mentorReputationService.calculate(mentor.ownerId);
    return { ...mentor, reputation };
  }

  @Post(":id/book")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createMentorBookingInputSchema))
  @ApiOperation({ summary: "Request a session with a mentor" })
  book(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateMentorBookingInput) {
    return this.bookingService.book(user.sub, id, input);
  }

  @Post("bookings/:id/respond")
  @Roles("MENTOR")
  @UsePipes(new ZodValidationPipe(respondToMentorBookingInputSchema))
  @ApiOperation({ summary: "Accept or decline a booking request" })
  respond(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: RespondToMentorBookingInput) {
    return this.bookingService.respond(id, user.sub, input.action);
  }

  @Post("bookings/:id/review")
  @Roles("MENTOR")
  @UsePipes(new ZodValidationPipe(createFounderReviewInputSchema))
  @ApiOperation({ summary: "Review the founder from an accepted booking — feeds their Founder Reputation score" })
  review(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateFounderReviewInput) {
    return this.founderReviewsService.create(user.sub, id, input);
  }

  @Post("bookings/:id/review-mentor")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createMentorReviewInputSchema))
  @ApiOperation({ summary: "Review the mentor from an accepted booking — the only source of mentor trust (spec §5)" })
  reviewMentor(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateMentorReviewInput) {
    return this.mentorReviewsService.create(user.sub, id, input);
  }
}
