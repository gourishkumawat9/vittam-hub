import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { buildTestApp } from "./support/app";
import { CSRF_TOKEN, cookieHeader, loginViaApi, normalizeSetCookie, registerViaApi } from "./support/auth";
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
        .set("Cookie", cookieHeader([]))
        .set("X-CSRF-Token", CSRF_TOKEN)
        .send({
          email: "not-an-email",
          password: "weak",
          fullName: "",
          role: "FOUNDER",
          acceptedTerms: false,
        });
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
      const res = await request(app.getHttpServer()).get("/v1/auth/me").set("Authorization", "Bearer not.a.real.jwt");
      expect(res.status).toBe(401);
    });
  });

  describe("refresh + logout lifecycle", () => {
    const refresh = (cookies: string[]) =>
      request(app.getHttpServer()).post("/v1/auth/refresh").set("Cookie", cookieHeader(cookies)).set("X-CSRF-Token", CSRF_TOKEN);
    const cookieNames = (res: { headers: Record<string, unknown> }) =>
      normalizeSetCookie(res.headers["set-cookie"] as string[] | undefined).map((cookie) => cookie.split("=")[0]);

    it("rotates the refresh token on every renewal", async () => {
      const reg = await registerViaApi(app);

      const refreshed = await refresh(reg.cookies);
      expect(refreshed.status).toBe(200);
      expect(cookieNames(refreshed)).toEqual(expect.arrayContaining(["vh_session", "vh_refresh"]));

      const [retired, successor] = await testDb.refreshToken.findMany({ orderBy: { createdAt: "asc" } });
      expect(retired?.revokedAt).not.toBeNull();
      expect(retired?.rotatedAt).not.toBeNull();
      expect(successor?.revokedAt).toBeNull();
      // Both belong to the one sign-in, so they can be ended together.
      expect(successor?.familyId).toBe(retired?.familyId);
    });

    it("answers the same token again within moments (two tabs renewing at once) without signing anyone out", async () => {
      const reg = await registerViaApi(app);
      await refresh(reg.cookies);

      const again = await refresh(reg.cookies);

      expect(again.status).toBe(200);
      // A fresh access token, but no second refresh token: the browser keeps the one the first answer set.
      expect(cookieNames(again)).toContain("vh_session");
      expect(cookieNames(again)).not.toContain("vh_refresh");
      expect(await testDb.refreshToken.count()).toBe(2);
    });

    it("treats a retired token turning up later as stolen and ends that whole sign-in", async () => {
      const reg = await registerViaApi(app);
      const refreshed = await refresh(reg.cookies);
      const successorCookies = normalizeSetCookie(refreshed.headers["set-cookie"]);

      // Move the rotation into the past, beyond the few seconds two tabs could overlap.
      await testDb.refreshToken.updateMany({
        where: { rotatedAt: { not: null } },
        data: { rotatedAt: new Date(Date.now() - 5 * 60_000) },
      });

      expect((await refresh(reg.cookies)).status).toBe(401);
      // Whoever holds the successor, thief or owner, is signed out too.
      expect((await refresh(successorCookies)).status).toBe(401);
      expect(await testDb.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
    });

    it("logout ends the session: the refresh token can't renew it afterwards", async () => {
      const reg = await registerViaApi(app);

      const loggedOut = await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Cookie", cookieHeader(reg.cookies))
        .set("X-CSRF-Token", CSRF_TOKEN);
      expect(loggedOut.status).toBe(200);

      expect((await refresh(reg.cookies)).status).toBe(401);
    });

    it("a token retired by rotation can't renew after logout, even moments later", async () => {
      const reg = await registerViaApi(app);
      const refreshed = await refresh(reg.cookies);

      await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Cookie", cookieHeader(normalizeSetCookie(refreshed.headers["set-cookie"])))
        .set("X-CSRF-Token", CSRF_TOKEN);

      expect((await refresh(reg.cookies)).status).toBe(401);
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
