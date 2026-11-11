import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../types/authenticated-user";

import { isDemoViewer } from "./demo-scope";

/**
 * Demo logins are shared by everyone who tries the site, so the settings
 * that would lock the next visitor out (password, two-step login, deleting
 * the account) are switched off for them. Use with `@UseGuards(NotDemoGuard)`;
 * it runs after the global JWT guard, so `request.user` is already set.
 */
@Injectable()
export class NotDemoGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (await isDemoViewer(this.prisma, user?.sub)) {
      throw new ForbiddenException("Demo accounts are shared, so this setting is locked.");
    }
    return true;
  }
}
