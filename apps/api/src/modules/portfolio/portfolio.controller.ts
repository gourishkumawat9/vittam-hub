import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
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
}
