import { randomBytes } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Issues the double-submit CSRF cookie (docs/09-authentication-security.md
 * §CSRF — this was documented as "not yet wired end-to-end" until now).
 * Deliberately readable (not httpOnly): the frontend echoes its value back
 * as the X-CSRF-Token header on every mutating request, and CsrfGuard checks
 * the two match. A same-site attacker's page can't read this cookie's value
 * (browsers enforce that), so it can't forge a matching header even though
 * SameSite=Lax alone lets the cookie itself ride along on some cross-site
 * requests.
 *
 * `domain` is set to the parent registrable domain in production
 * (`.vittamhub.com`) so a cookie issued by api.vittamhub.com is readable by
 * JS running on vittamhub.com — without this, document.cookie on the
 * frontend origin would never see it, since cookies are readable by JS only
 * on the domain(s) they're scoped to.
 */
export function csrfCookieMiddleware(isProd: boolean, appUrl: string) {
  const domain = isProd ? `.${new URL(appUrl).hostname}` : undefined;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      const token = randomBytes(32).toString("hex");
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        domain,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
      // Make it available to the rest of this same request too (e.g. the
      // dedicated bootstrap endpoint doesn't need this, but nothing should
      // have to wait for a second round-trip to see its own fresh cookie).
      req.cookies = { ...req.cookies, [CSRF_COOKIE_NAME]: token };
    }
    next();
  };
}
