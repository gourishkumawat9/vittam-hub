import { Body, Controller, Get, Param, Patch, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { recordExitInputSchema, setFollowUpInputSchema, type RecordExitInput, type SetFollowUpInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { PortfolioService } from "./portfolio.service";

@ApiTags("portfolio")
@Controller("v1/portfolio")
@Roles("INVESTOR")
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's invested portfolio companies with live stage/revenue/team size" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.portfolioService.listForInvestor(user.sub);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Portfolio dashboard — totals, average trust, recent improvements, upcoming follow-ups (Investor Workspace §9)" })
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.portfolioService.getDashboard(user.sub);
  }

  @Patch(":startupId/exit")
  @UsePipes(new ZodValidationPipe(recordExitInputSchema))
  @ApiOperation({ summary: "Record a real exit for a portfolio holding" })
  recordExit(@CurrentUser() user: AuthenticatedUser, @Param("startupId") startupId: string, @Body() input: RecordExitInput) {
    return this.portfolioService.recordExit(user.sub, startupId, input.exitValueAmount);
  }

  @Patch(":startupId/follow-up")
  @UsePipes(new ZodValidationPipe(setFollowUpInputSchema))
  @ApiOperation({ summary: "Set (or clear) the next follow-up date for a portfolio holding" })
  setFollowUp(@CurrentUser() user: AuthenticatedUser, @Param("startupId") startupId: string, @Body() input: SetFollowUpInput) {
    return this.portfolioService.setFollowUp(user.sub, startupId, input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null);
  }
}
