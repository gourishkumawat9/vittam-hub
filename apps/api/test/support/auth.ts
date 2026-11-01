import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { TEST_PASSWORD, uniqueEmail } from "./factories";

/**
 * The double-submit CSRF pair CsrfGuard requires on every POST/PUT/PATCH/DELETE:
 * a csrf_token cookie and a matching X-CSRF-Token header. The browser gets its
 * cookie from csrfCookieMiddleware; here any value works as long as both match.
 */
export const CSRF_TOKEN = "e2e-csrf-token";
const CSRF_COOKIE = `csrf_token=${CSRF_TOKEN}`;

export interface RegisterOverrides {
  email?: string;
  password?: string;
  fullName?: string;
  role?: "FOUNDER" | "INVESTOR" | "MENTOR" | "INCUBATOR" | "UNIVERSITY" | "SERVICE_PROVIDER" | "JOB_SEEKER";
}

export interface AuthResult {
  status: number;
  body: Record<string, unknown> & {
    data?: Record<string, unknown>;
    error?: Record<string, unknown>;
  };
  cookies: string[];
  email: string;
  password: string;
}

/** Register through the real HTTP endpoint; returns the session cookies it set. */
export async function registerViaApi(app: INestApplication, overrides: RegisterOverrides = {}): Promise<AuthResult> {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? TEST_PASSWORD;
  const res = await request(app.getHttpServer())
    .post("/v1/auth/register")
    .set("Cookie", CSRF_COOKIE)
    .set("X-CSRF-Token", CSRF_TOKEN)
    .send({
      email,
      password,
      fullName: overrides.fullName ?? "Test User",
      role: overrides.role ?? "FOUNDER",
      acceptedTerms: true,
    });
  return {
    status: res.status,
    body: res.body,
    cookies: normalizeCookies(res.headers["set-cookie"]),
    email,
    password,
  };
}

/** Log in through the real HTTP endpoint; returns the session cookies it set. */
export async function loginViaApi(app: INestApplication, email: string, password: string): Promise<AuthResult> {
  const res = await request(app.getHttpServer())
    .post("/v1/auth/login")
    .set("Cookie", CSRF_COOKIE)
    .set("X-CSRF-Token", CSRF_TOKEN)
    .send({ email, password });
  return {
    status: res.status,
    body: res.body,
    cookies: normalizeCookies(res.headers["set-cookie"]),
    email,
    password,
  };
}

export function normalizeSetCookie(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

const normalizeCookies = normalizeSetCookie;

/**
 * Turn response Set-Cookie strings (which carry attributes like `; Path=/;
 * HttpOnly`) into a request `Cookie` header of just `name=value` pairs. Passing
 * the raw Set-Cookie strings back mangles the second cookie and breaks parsing.
 * It includes the CSRF cookie, so a mutating request only needs the
 * X-CSRF-Token header on top.
 */
export function cookieHeader(setCookies: string[]): string {
  return [...setCookies.map((cookie) => cookie.split(";")[0]), CSRF_COOKIE].join("; ");
}
