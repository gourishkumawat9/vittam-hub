import { ExecutionContext , createParamDecorator } from "@nestjs/common";

import { AuthenticatedUser } from "../types/authenticated-user";

/** `@CurrentUser() user: AuthenticatedUser` — reads the JWT payload attached by JwtStrategy.validate(). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
