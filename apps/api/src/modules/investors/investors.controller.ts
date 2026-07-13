import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { createInvestorInputSchema, type CreateInvestorInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { InvestorsService } from "./investors.service";

@ApiTags("investors")
@Controller("v1/investors")
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Browse public investor profiles" })
  list() {
    return this.investorsService.list();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a public investor profile" })
  getById(@Param("id") id: string) {
    return this.investorsService.getById(id);
  }

  @Post()
  @Roles("INVESTOR")
  @UsePipes(new ZodValidationPipe(createInvestorInputSchema))
  @ApiOperation({ summary: "Create the caller's investor profile" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateInvestorInput) {
    return this.investorsService.create(user.sub, input);
  }
}
