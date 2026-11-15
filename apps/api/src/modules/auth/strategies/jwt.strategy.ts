import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserRole } from "@vittamhub/types";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { PrismaService } from "../../../database/prisma/prisma.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What AuthService.signAccessToken puts in the session cookie. */
interface AccessTokenPayload {
  sub?: unknown;
  email?: unknown;
  role?: unknown;
  /** The sign-in this token belongs to: the id shared by its chain of refresh tokens. */
  sid?: unknown;
  purpose?: unknown;
}

const sessionOver = () => new UnauthorizedException("Session expired — please log in again");

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
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
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
   *
   * A signature only proves the token was issued, not that the sign-in it
   * came from is still open. So each request also looks the sign-in up: once
   * the person signs out, changes or resets their password, ends that session
   * from another device or deletes the account, nothing in the family is live
   * and the token stops working at that moment rather than up to fifteen
   * minutes later. `email` and `role` are read from the account at the same
   * time, so they can't go stale inside a token either.
   *
   * A token from before this check existed has no `sid`; it is refused like
   * an expired one and the browser quietly renews it.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (payload.purpose !== undefined) {
      throw new UnauthorizedException("This token cannot be used to authenticate a request");
    }
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new UnauthorizedException("Malformed session token");
    }
    if (!Object.values(UserRole).includes(payload.role as UserRole)) {
      throw new UnauthorizedException("Malformed session token");
    }
    if (typeof payload.sid !== "string" || !UUID.test(payload.sid) || !UUID.test(payload.sub)) throw sessionOver();

    const session = await this.prisma.refreshToken.findFirst({
      where: {
        familyId: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
      select: { user: { select: { email: true, role: true } } },
    });
    if (!session) throw sessionOver();

    return { sub: payload.sub, email: session.user.email, role: session.user.role as UserRole };
  }
}
