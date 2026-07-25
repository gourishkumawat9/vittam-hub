import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Applied globally in app.module.ts (APP_GUARD) — every route is protected
 * by default; opt out with @Public(). On a @Public() route this now runs
 * "soft auth" — a valid token still populates `request.user` (e.g. so a
 * public startup profile can tell an authenticated investor from an
 * anonymous visitor, see StartupPublicProjectionService), but a missing or
 * invalid token never blocks the request the way it would on a protected
 * route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return !!this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (this.isPublicRoute(context)) {
      return (user || null) as TUser; // soft auth — attach the user if present, never block
    }
    if (err || !user) throw err instanceof Error ? err : new UnauthorizedException();
    return user;
  }
}
