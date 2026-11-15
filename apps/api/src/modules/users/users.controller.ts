import { Body, Controller, Delete, HttpCode, Res, UseGuards, UsePipes } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { deleteAccountInputSchema, type DeleteAccountInput } from "@vittamhub/types";
import type { Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotDemoGuard } from "../../common/demo/not-demo.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { clearSessionCookies } from "../auth/session-cookies";

import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("v1/users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Delete("me")
  @UseGuards(NotDemoGuard)
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(deleteAccountInputSchema))
  @ApiOperation({ summary: "Delete the caller's account, everything public about it, and every session" })
  async deleteMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: DeleteAccountInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersService.confirmPasswordForDeletion(user.sub, input.password);
    await this.usersService.deleteAccount(user.sub);
    // Without this the browser kept a session cookie that stays valid for up
    // to 15 minutes, and the app went on treating the person as signed in.
    clearSessionCookies(res, this.configService);
  }
}
