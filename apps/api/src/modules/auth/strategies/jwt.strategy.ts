import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
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

  validate(payload: AuthenticatedUser): AuthenticatedUser {
    return payload;
  }
}
