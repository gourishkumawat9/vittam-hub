import { Controller, Delete, HttpCode, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotDemoGuard } from "../../common/demo/not-demo.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("v1/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete("me")
  @UseGuards(NotDemoGuard)
  @HttpCode(204)
  @ApiOperation({ summary: "Soft-delete the caller's account and revoke every session" })
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.softDelete(user.sub);
  }
}
