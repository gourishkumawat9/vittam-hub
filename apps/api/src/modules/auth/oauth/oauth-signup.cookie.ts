import { MemberPersona, PERSONA_ROLE, REGISTERABLE_ROLES } from "@vittamhub/types";
import type { Request, Response } from "express";

const SIGNUP_COOKIE = "vh_oauth_signup";
const SIGNUP_COOKIE_PATH = "/v1/auth";
const SIGNUP_TTL_MS = 10 * 60 * 1000;

/** A persona someone may sign up as today (service providers and job seekers are paused, see CLAUDE.md §11). */
export function signupPersonaFrom(value: unknown): MemberPersona | undefined {
  if (typeof value !== "string" || !(Object.values(MemberPersona) as string[]).includes(value)) return undefined;
  const persona = value as MemberPersona;
  return (REGISTERABLE_ROLES as readonly string[]).includes(PERSONA_ROLE[persona]) ? persona : undefined;
}

/**
 * "Continue with Google" on the sign-up page carries the account type the
 * person just picked (`/v1/auth/google?persona=STUDENT`). The provider's round
 * trip drops the query string, so the choice waits in a short-lived cookie,
 * scoped like the OAuth state cookie, until the callback reads it.
 *
 * Starting from the login page sends no persona and clears any old choice, so
 * a stale cookie can never decide the role of a later sign-up.
 */
export function rememberSignupPersona(req: Request, res: Response, secure: boolean): void {
  const persona = signupPersonaFrom(req.query?.persona);
  if (!persona) {
    if (req.cookies?.[SIGNUP_COOKIE]) res.clearCookie(SIGNUP_COOKIE, { path: SIGNUP_COOKIE_PATH });
    return;
  }
  res.cookie(SIGNUP_COOKIE, persona, { httpOnly: true, secure, sameSite: "lax", path: SIGNUP_COOKIE_PATH, maxAge: SIGNUP_TTL_MS });
}

/** Reads the choice once and forgets it. */
export function takeSignupPersona(req: Request, res: Response): MemberPersona | undefined {
  const persona = signupPersonaFrom(req.cookies?.[SIGNUP_COOKIE]);
  if (req.cookies?.[SIGNUP_COOKIE]) res.clearCookie(SIGNUP_COOKIE, { path: SIGNUP_COOKIE_PATH });
  return persona;
}
