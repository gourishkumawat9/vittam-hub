import { randomBytes, timingSafeEqual } from "node:crypto";

import type { Request } from "express";

const STATE_COOKIE = "vh_oauth_state";
const STATE_COOKIE_PATH = "/v1/auth";
const STATE_TTL_MS = 10 * 60 * 1000;

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (err: Error | null, ok: boolean, info?: { message: string }) => void;

function sameValue(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * The OAuth `state` check, kept in a cookie because this API has no server
 * sessions for passport's own store to use.
 *
 * Without it the callback accepts any authorization code, so a link an
 * attacker prepares can finish *their* sign-in in someone else's browser: the
 * victim ends up inside the attacker's account without noticing and fills it
 * with their own startup's details. Here the browser that starts a sign-in
 * gets a random value in a cookie, the same value travels to the provider and
 * back in the URL, and the callback only goes ahead when the two match.
 *
 * The cookie is host-only and SameSite=Lax: it comes back on the provider's
 * redirect (a top-level navigation) but not on requests other sites make.
 */
export class OAuthStateCookieStore {
  constructor(private readonly secure: boolean) {}

  // passport-oauth2 chooses how to call this from its number of parameters, so it must stay at exactly two.
  store(req: Request, callback: StoreCallback): void {
    const state = randomBytes(24).toString("hex");
    req.res?.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.secure,
      sameSite: "lax",
      path: STATE_COOKIE_PATH,
      maxAge: STATE_TTL_MS,
    });
    callback(null, state);
  }

  // Three parameters, for the same reason.
  verify(req: Request, providedState: string, callback: VerifyCallback): void {
    const expected: unknown = req.cookies?.[STATE_COOKIE];
    // One use only, whether or not it matched.
    req.res?.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

    if (typeof expected !== "string" || typeof providedState !== "string" || !sameValue(expected, providedState)) {
      callback(null, false, { message: "This sign-in link has expired or was started in another browser" });
      return;
    }
    callback(null, true);
  }
}
