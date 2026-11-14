import { ExecutionContext , ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@vittamhub/types";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthenticatedUser } from "../types/authenticated-user";

@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // `user` is null on a @Public() route nobody is signed in to. Nothing
    // combines @Public() with @Roles() today; if a route ever does, that must
    // read as "not allowed", not crash into a 500.
    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser | null }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("You do not have permission to access this resource");
    }
    return true;
  }
}
