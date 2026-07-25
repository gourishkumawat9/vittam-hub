import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createFundingRoundInputSchema,
  createMilestoneInputSchema,
  createStartupInputSchema,
  startupSearchFiltersSchema,
  updateStartupVisibilityInputSchema,
  updateTractionInputSchema,
  type CreateFundingRoundInput,
  type CreateMilestoneInput,
  type CreateStartupInput,
  type StartupSearchFilters,
  type UpdateStartupVisibilityInput,
  type UpdateTractionInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { MatchScoreService } from "../investors/match-score.service";
import { TrustEngineService } from "../trust/trust-engine.service";

import { BenchmarkService } from "./benchmark.service";
import { FounderActivityService } from "./founder-activity.service";
import { FounderAnalyticsService } from "./founder-analytics.service";
import { FounderReputationService } from "./founder-reputation.service";
import { FundingRoundsService } from "./funding-rounds.service";
import { MilestonesService } from "./milestones.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { ProfileViewsService } from "./profile-views.service";
import { StartupPublicProjectionService } from "./startup-public-projection.service";
import { StartupsService } from "./startups.service";
import { TractionService } from "./traction.service";
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
    private readonly trustEngine: TrustEngineService,
    private readonly tractionService: TractionService,
    private readonly fundingRoundsService: FundingRoundsService,
    private readonly publicProjection: StartupPublicProjectionService,
    private readonly benchmarkService: BenchmarkService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(startupSearchFiltersSchema))
  @ApiOperation({ summary: "Discover startups — advanced filters, smart search, Trust Score + Match Score for investors" })
  async search(@CurrentUser() user: AuthenticatedUser, @Query() filters: StartupSearchFilters) {
    const result = await this.startupsService.search(filters, user.sub);

    const projectedOrNull = await Promise.all(
      result.items.map(async (startup) => {
        // isPublic already filters the DB query, but `visibility` (INVESTOR_ONLY/PRIVATE/STEALTH) is a finer-grained,
        // independent toggle — a viewer who fails that gate just gets the row dropped from results, not a 403 that
        // would take down the whole list.
        let projected: typeof startup;
        try {
          projected = this.publicProjection.project(startup, {
            isOwner: startup.ownerId === user.sub,
            isInvestor: user.role === "INVESTOR",
          });
        } catch {
          return null;
        }

        const trustScore = await this.trustScoreService.calculate(startup.id);
        const matchScore =
          user.role === "INVESTOR" ? (await this.matchScoreService.scoreManyForInvestor(user.sub, [startup])).get(startup.id) : undefined;
        // Never expose the factors breakdown externally — only score + band.
        return { ...projected, trustScore: { score: trustScore.score, band: trustScore.band }, matchScore: matchScore ?? null };
      }),
    );
    const items = projectedOrNull.filter((item): item is NonNullable<typeof item> => item !== null);

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

  @Get("me/trust-preview")
  @Roles("FOUNDER")
  @ApiOperation({
    summary:
      "Preview Trust Score v2 (verification-only model) for the caller's own startup — score, band, full breakdown, next-best-actions, and history. Not shown to anyone else; v1 remains the score everyone else sees until the v2 cutover.",
  })
  async getMyTrustPreview(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    return this.trustEngine.getPreview(startup.id);
  }

  @Post("me/traction")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(updateTractionInputSchema))
  @ApiOperation({ summary: "Update the caller's traction metrics — overwrites the current-value display AND appends to metric history (Bundle 10)" })
  updateMyTraction(@CurrentUser() user: AuthenticatedUser, @Body() input: UpdateTractionInput) {
    return this.tractionService.updateMine(user.sub, input);
  }

  @Get("me/traction-history")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Dated history for every traction metric, grouped by metric key — the data behind a trend chart" })
  async getMyTractionHistory(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    return this.tractionService.history(startup.id);
  }

  @Get("me/benchmark")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Growth-rate percentile vs. real peers (same industry + stage) — null if there isn't enough peer data yet, never a fabricated number" })
  async getMyBenchmark(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    return this.benchmarkService.growthPercentile(startup.id);
  }

  @Patch("me/visibility")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(updateStartupVisibilityInputSchema))
  @ApiOperation({ summary: "Set who can see the caller's profile and how metrics show publicly (Bundle 30)" })
  updateMyVisibility(@CurrentUser() user: AuthenticatedUser, @Body() input: UpdateStartupVisibilityInput) {
    return this.startupsService.updateVisibility(user.sub, input);
  }

  @Get("me/funding-rounds")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "List the caller's funding rounds, most recent first, plus the computed total raised (Bundle 12)" })
  async listMyFundingRounds(@CurrentUser() user: AuthenticatedUser) {
    const startup = await this.startupsService.getMine(user.sub);
    const [rounds, total] = await Promise.all([
      this.fundingRoundsService.listForStartup(startup.id),
      this.fundingRoundsService.totalRaised(startup.id),
    ]);
    return { rounds, ...total };
  }

  @Post("me/funding-rounds")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createFundingRoundInputSchema))
  @ApiOperation({ summary: "Add a historical funding round to the caller's startup" })
  addMyFundingRound(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateFundingRoundInput) {
    return this.fundingRoundsService.addForMine(user.sub, input);
  }

  @Delete("me/funding-rounds/:id")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Remove one of the caller's funding rounds" })
  removeMyFundingRound(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.fundingRoundsService.removeMine(user.sub, id);
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
  @ApiOperation({ summary: "Get a public startup profile by slug — a filtered projection, never the raw record (Bundle 30)" })
  async getBySlug(@Param("slug") slug: string, @CurrentUser() user: AuthenticatedUser | null) {
    const startup = await this.startupsService.getBySlug(slug);
    const projected = this.publicProjection.project(startup, {
      isOwner: startup.ownerId === user?.sub,
      isInvestor: user?.role === "INVESTOR",
    });
    const trustScore = await this.trustScoreService.calculate(startup.id);
    // Public profile — never expose the factors breakdown, only score + band.
    return { ...projected, trustScore: { score: trustScore.score, band: trustScore.band } };
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
