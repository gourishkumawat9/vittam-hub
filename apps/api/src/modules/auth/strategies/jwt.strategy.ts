import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserRole } from "@vittamhub/types";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthenticatedUser } from "../../../common/types/authenticated-user";

/**
 * Reads the access token from the httpOnly session cookie (never from an
 * Authorization header — see docs/09-authentication-security.md for why
 * we chose cookie-based sessions over localStorage tokens: XSS resilience).
 */
function cookieExtractor(req: Request): string | null {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "vh_session";
  return req?.cookies?.[cookieName] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  /**
   * Only a full session token may authenticate a request.
   *
   * This guard exists because other short-lived tokens are also minted by
   * this app (the MFA challenge token, `AuthService.login`), and a JWT is
   * only as trustworthy as the claims you actually check. Returning the raw
   * payload here previously meant an MFA challenge token — handed to the
   * client in the login response body *before* the second factor is
   * verified — was accepted as a valid session cookie, bypassing MFA
   * entirely. Challenge tokens are now signed with a different secret too
   * (see AuthService), so this is defence in depth rather than the only
   * thing standing between an attacker and a session.
   *
   * A session payload carries `email` + `role` and never a `purpose` claim.
   */
  validate(payload: AuthenticatedUser & { purpose?: string }): AuthenticatedUser {
    if (payload.purpose !== undefined) {
      throw new UnauthorizedException("This token cannot be used to authenticate a request");
    }
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new UnauthorizedException("Malformed session token");
    }
    if (!Object.values(UserRole).includes(payload.role)) {
      throw new UnauthorizedException("Malformed session token");
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
