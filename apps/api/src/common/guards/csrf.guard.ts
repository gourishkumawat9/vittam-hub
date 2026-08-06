import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { SKIP_CSRF_KEY } from "../decorators/skip-csrf.decorator";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../middleware/csrf-cookie.middleware";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit cookie check — every mutating request (POST/PUT/PATCH/DELETE)
 * must echo the csrf_token cookie's value back as X-CSRF-Token. Applies
 * globally, including @Public() routes (login/register are exactly what
 * this is meant to protect, per docs/09-authentication-security.md) — the
 * only exemption is @SkipCsrf(), for server-to-server endpoints that verify
 * their own signature instead (the Stripe webhook).
 */
@Injectable()
export class CsrfGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [context.getHandler(), context.getClass()]);
    if (skip) return true;

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException("Invalid or missing CSRF token");
    }
    return true;
  }
}
