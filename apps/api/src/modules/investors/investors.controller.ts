import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createInvestorInputSchema,
  investorSearchFiltersSchema,
  updateInvestorInputSchema,
  type CreateInvestorInput,
  type InvestorSearchFilters,
  type UpdateInvestorInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { InvestorMetricsService } from "./investor-metrics.service";
import { InvestorsService } from "./investors.service";

@ApiTags("investors")
@Controller("v1/investors")
export class InvestorsController {
  constructor(
    private readonly investorsService: InvestorsService,
    private readonly investorMetricsService: InvestorMetricsService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(investorSearchFiltersSchema))
  @ApiOperation({ summary: "Browse investor profiles, filterable by industry/country/stage/ticket size/type" })
  async list(@CurrentUser() user: AuthenticatedUser, @Query() filters: InvestorSearchFilters) {
    const result = await this.investorsService.list(filters, user.sub);
    const metricsByOwner = await this.investorMetricsService.getManyFor(result.items.map((investor) => investor.ownerId));
    const items = result.items.map((investor) => ({ ...investor, metrics: metricsByOwner.get(investor.ownerId) ?? null }));
    return { ...result, items };
  }

  @Get("me")
  @Roles("INVESTOR")
  @ApiOperation({ summary: "Get the caller's own investor profile" })
  async getMine(@CurrentUser() user: AuthenticatedUser) {
    const investor = await this.investorsService.getMine(user.sub);
    const metrics = await this.investorMetricsService.getFor(user.sub);
    return { ...investor, metrics };
  }

  @Patch("me")
  @Roles("INVESTOR")
  @UsePipes(new ZodValidationPipe(updateInvestorInputSchema))
  @ApiOperation({ summary: "Update the caller's own investor profile" })
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() input: UpdateInvestorInput) {
    return this.investorsService.update(user.sub, input);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a public investor profile" })
  async getById(@Param("id") id: string) {
    const investor = await this.investorsService.getById(id);
    const metrics = await this.investorMetricsService.getFor(investor.ownerId);
    return { ...investor, metrics };
  }

  @Post()
  @Roles("INVESTOR")
  @UsePipes(new ZodValidationPipe(createInvestorInputSchema))
  @ApiOperation({ summary: "Create the caller's investor profile" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateInvestorInput) {
    return this.investorsService.create(user.sub, input);
  }
}
