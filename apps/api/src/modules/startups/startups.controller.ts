import { Body, Controller, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createMilestoneInputSchema,
  createStartupInputSchema,
  startupSearchFiltersSchema,
  type CreateMilestoneInput,
  type CreateStartupInput,
  type StartupSearchFilters,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { MatchScoreService } from "../investors/match-score.service";

import { FounderActivityService } from "./founder-activity.service";
import { FounderAnalyticsService } from "./founder-analytics.service";
import { FounderReputationService } from "./founder-reputation.service";
import { MilestonesService } from "./milestones.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { ProfileViewsService } from "./profile-views.service";
import { StartupsService } from "./startups.service";
import { TrustScoreService } from "./trust-score.service";

@ApiTags("startups")
@Controller("v1/startups")
export class StartupsController {
  constructor(
    private readonly startupsService: StartupsService,
    private readonly trustScoreService: TrustScoreService,
    private readonly profileCompletionService: ProfileCompletionService,
    private readonly milestonesService: MilestonesService,
    private readonly matchScoreService: MatchScoreService,
    private readonly founderActivityService: FounderActivityService,
    private readonly profileViewsService: ProfileViewsService,
    private readonly founderReputationService: FounderReputationService,
    private readonly founderAnalyticsService: FounderAnalyticsService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(startupSearchFiltersSchema))
  @ApiOperation({ summary: "Discover startups — advanced filters, smart search, Trust Score + Match Score for investors" })
  async search(@CurrentUser() user: AuthenticatedUser, @Query() filters: StartupSearchFilters) {
    const result = await this.startupsService.search(filters, user.sub);

    const items = await Promise.all(
      result.items.map(async (startup) => {
        const trustScore = await this.trustScoreService.calculate(startup.id);
        const matchScore =
          user.role === "INVESTOR" ? (await this.matchScoreService.scoreManyForInvestor(user.sub, [startup])).get(startup.id) : undefined;
        // Never expose the factors breakdown externally — only score + band.
        return { ...startup, trustScore: { score: trustScore.score, band: trustScore.band }, matchScore: matchScore ?? null };
      }),
    );

    return { ...result, items };
  }

  @Get("me")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Get the caller's own startup profile" })
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.startupsService.getMine(user.sub);
  }

  @Get("me/health")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Get the caller's Trust Score, Founder Reputation, and profile-completion status — full transparency, owner-only" })
  async getMyHealth(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    const [trustScore, profileCompletion, founderReputation] = await Promise.all([
      this.trustScoreService.calculate(startup.id),
      this.profileCompletionService.calculate(startup.id),
      this.founderReputationService.calculate(user.sub, startup.id),
    ]);
    return { trustScore, profileCompletion, founderReputation };
  }

  @Get("me/activity")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Founder-only activity feed for the caller's startup — includes connect requests received and pitch-deck uploads, never shown publicly" })
  async getMyActivity(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    return this.founderActivityService.getOwnerForStartup(startup.id);
  }

  @Get("me/views")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Recent investors who viewed the caller's startup profile" })
  async getMyProfileViews(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    return this.profileViewsService.listRecentForStartup(startup.id);
  }

  @Get("me/analytics")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Founder analytics — weekly profile views, connection requests, followers, milestones, computed from real activity" })
  async getMyAnalytics(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    const [analytics, profileCompletion] = await Promise.all([
      this.founderAnalyticsService.getForStartup(startup.id),
      this.profileCompletionService.calculate(startup.id),
    ]);
    return { ...analytics, profileCompletionPercent: profileCompletion.percent };
  }

  @Post("me/milestones")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createMilestoneInputSchema))
  @ApiOperation({ summary: "Add a milestone to the caller's own startup timeline" })
  addMilestone(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateMilestoneInput) {
    return this.milestonesService.addForOwner(user.sub, input);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get a public startup profile by slug" })
  async getBySlug(@Param("slug") slug: string) {
    const startup = await this.startupsService.getBySlug(slug);
    const trustScore = await this.trustScoreService.calculate(startup.id);
    // Public profile — never expose the factors breakdown, only score + band.
    return { ...startup, trustScore: { score: trustScore.score, band: trustScore.band } };
  }

  @Public()
  @Get(":slug/milestones")
  @ApiOperation({ summary: "List a startup's public timeline, in chronological order" })
  async listMilestones(@Param("slug") slug: string) {
    const startup = await this.startupsService.getBySlug(slug);
    return this.milestonesService.listForStartup(startup.id);
  }

  @Public()
  @Get(":slug/activity")
  @ApiOperation({ summary: "Public activity feed for a startup — milestones, updates, job postings, traction changes" })
  async getPublicActivity(@Param("slug") slug: string) {
    const startup = await this.startupsService.getBySlug(slug);
    return this.founderActivityService.getPublicForStartup(startup.id);
  }

  @Post(":slug/view")
  @Roles("INVESTOR")
  @ApiOperation({ summary: "Record that the caller (an investor) viewed this startup's profile — throttled to once per day" })
  async recordView(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    const startup = await this.startupsService.getBySlug(slug);
    return this.profileViewsService.recordView(user.sub, startup.id);
  }

  @Post()
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createStartupInputSchema))
  @ApiOperation({ summary: "Create the caller's startup profile (one per founder)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateStartupInput) {
    return this.startupsService.create(user.sub, input);
  }
}
