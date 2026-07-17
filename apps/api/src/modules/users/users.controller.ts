import { Controller, Delete, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("v1/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete("me")
  @HttpCode(204)
  @ApiOperation({ summary: "Soft-delete the caller's account and revoke every session" })
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.softDelete(user.sub);
  }
}
