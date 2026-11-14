import type { ConfigService } from "@nestjs/config";
import type { CookieOptions, Response } from "express";

export const REFRESH_COOKIE_NAME = "vh_refresh";

/**
 * In production the API (api.vittamhub.com) and the web app (vittamhub.com)
 * are different hosts. A cookie set without `domain` is host-only, so the
 * web app's middleware never saw the session and bounced every signed-in
 * user from /founder, /investor and /admin back to /login. Scoping to the
 * parent domain — as csrfCookieMiddleware already does — fixes that.
 */
function cookieScope(config: ConfigService): { isProd: boolean; domain: string | undefined } {
  const isProd = config.get("NODE_ENV") === "production";
  const domain = isProd ? `.${new URL(config.getOrThrow<string>("APP_URL")).hostname}` : undefined;
  return { isProd, domain };
}

function sessionCookieName(config: ConfigService): string {
  return config.get("SESSION_COOKIE_NAME", "vh_session");
}

export function clearSessionCookies(res: Response, config: ConfigService): void {
  // Cookies only clear when path and domain match how they were set.
  const { domain } = cookieScope(config);
  const sessionCookie = sessionCookieName(config);
  res.clearCookie(sessionCookie, { path: "/", domain });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/", domain });
  if (domain) {
    // Sessions issued before cookies were domain-scoped were host-only.
    res.clearCookie(sessionCookie, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  }
}

/**
 * `refreshToken` is absent in one case only, the renewal grace period (see
 * AuthService.refresh): the refresh cookie already in the browser stays.
 */
export function setSessionCookies(
  res: Response,
  config: ConfigService,
  accessToken: string,
  refreshToken: string | undefined,
  rememberMe: boolean,
): void {
  const { isProd, domain } = cookieScope(config);
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    domain,
  };

  res.cookie(sessionCookieName(config), accessToken, {
    ...baseOptions,
    maxAge: 1000 * 60 * 15, // 15m, mirrors JWT_ACCESS_TTL
  });
  if (!refreshToken) return;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseOptions,
    maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24,
  });
}
