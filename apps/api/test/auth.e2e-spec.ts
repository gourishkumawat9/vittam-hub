import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { buildTestApp } from "./support/app";
import { cookieHeader, loginViaApi, normalizeSetCookie, registerViaApi } from "./support/auth";
import { testDb, truncateAll } from "./support/database";
import { createUser, TEST_PASSWORD, uniqueEmail } from "./support/factories";

/**
 * Auth HTTP surface end-to-end against the isolated `vittamhub_test` schema.
 * The rate limiter is disabled here (see buildTestApp) so functional tests
 * don't trip the shared per-IP window; a dedicated block re-enables it.
 */
describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await testDb.$disconnect();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  describe("POST /v1/auth/register", () => {
    it("creates an account and returns 201 without leaking secret fields", async () => {
      const res = await registerViaApi(app);
      expect(res.status).toBe(201);
      const user = res.body.data?.user as Record<string, unknown>;
      expect(user.email).toBeDefined();
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).not.toHaveProperty("twoFactorSecret");
      expect(res.cookies.join(";")).toContain("vh_session");
    });

    it("rejects a duplicate email with 409", async () => {
      const email = uniqueEmail();
      await registerViaApi(app, { email });
      const dup = await registerViaApi(app, { email });
      expect(dup.status).toBe(409);
    });

    it("rejects an invalid payload (bad email, weak password, terms unchecked) with 400", async () => {
      const res = await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({ email: "not-an-email", password: "weak", fullName: "", role: "FOUNDER", acceptedTerms: false });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /v1/auth/login", () => {
    it("logs in with valid credentials and sets a session cookie", async () => {
      const email = uniqueEmail();
      await registerViaApi(app, { email });
      const res = await loginViaApi(app, email, TEST_PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ mfaRequired: false });
      expect(res.cookies.join(";")).toContain("vh_session");
    });

    it("rejects a wrong password with 401", async () => {
      const email = uniqueEmail();
      await registerViaApi(app, { email });
      const res = await loginViaApi(app, email, "WrongPass123!");
      expect(res.status).toBe(401);
    });

    it("rejects an unknown email with 401", async () => {
      const res = await loginViaApi(app, uniqueEmail(), TEST_PASSWORD);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /v1/auth/me", () => {
    it("returns the current user with a valid session cookie", async () => {
      const reg = await registerViaApi(app);
      const res = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", cookieHeader(reg.cookies));
      expect(res.status).toBe(200);
      expect(res.body.data?.email).toBe(reg.email);
    });

    it("returns 401 with no token", async () => {
      const res = await request(app.getHttpServer()).get("/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with a tampered token", async () => {
      const reg = await registerViaApi(app);
      const tampered = cookieHeader(reg.cookies).replace(/(vh_session=[^;]+)/, "$1TAMPERED");
      const res = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", tampered);
      expect(res.status).toBe(401);
    });

    it("returns 401 with a malformed bearer token", async () => {
      const res = await request(app.getHttpServer())
        .get("/v1/auth/me")
        .set("Authorization", "Bearer not.a.real.jwt");
      expect(res.status).toBe(401);
    });
  });

  describe("refresh + logout lifecycle", () => {
    it("refreshes a session, then rejects reuse of the rotated token, and logout ends the session", async () => {
      const reg = await registerViaApi(app);

      const refreshed = await request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .set("Cookie", cookieHeader(reg.cookies));
      expect(refreshed.status).toBe(200);

      // Rotation: the original refresh cookie must no longer work.
      const reused = await request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .set("Cookie", cookieHeader(reg.cookies));
      expect(reused.status).toBe(401);

      const rotatedCookies = normalizeSetCookie(refreshed.headers["set-cookie"]);
      const loggedOut = await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Cookie", cookieHeader(rotatedCookies));
      expect(loggedOut.status).toBe(200);
    });
  });

  describe("role-based access control", () => {
    it("forbids a FOUNDER from an admin-only route with 403", async () => {
      const reg = await registerViaApi(app, { role: "FOUNDER" });
      const res = await request(app.getHttpServer())
        .get("/v1/admin/plan-limits")
        .set("Cookie", cookieHeader(reg.cookies));
      expect(res.status).toBe(403);
    });

    it("requires authentication for the admin route (401 without a token)", async () => {
      const res = await request(app.getHttpServer()).get("/v1/admin/plan-limits");
      expect(res.status).toBe(401);
    });

    it("allows an ADMIN through the admin route", async () => {
      const admin = await createUser({ role: "ADMIN", emailVerified: true });
      const login = await loginViaApi(app, admin.email, TEST_PASSWORD);
      const res = await request(app.getHttpServer())
        .get("/v1/admin/plan-limits")
        .set("Cookie", cookieHeader(login.cookies));
      expect(res.status).toBe(200);
    });
  });
});

describe("Auth rate limiting (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildTestApp({ throttle: true }); // real ThrottlerGuard in this app instance
  });

  afterAll(async () => {
    await app.close();
  });

  it("throttles rapid login attempts with 429 (limit is 10/min)", async () => {
    const email = uniqueEmail();
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app.getHttpServer()).post("/v1/auth/login").send({ email, password: "whatever" });
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });
});
