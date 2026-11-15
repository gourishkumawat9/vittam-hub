import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import request from "supertest";

import { buildTestApp } from "./support/app";
import { CSRF_TOKEN, cookieHeader, loginViaApi, registerViaApi, type AuthResult } from "./support/auth";
import { testDb, truncateAll } from "./support/database";

/**
 * One test per security rule that was once broken, against the real HTTP
 * surface and a real database. Each `it` names the rule in plain words; if
 * one fails, that rule has stopped holding.
 */
describe("Security rules (e2e)", () => {
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

  const http = () => request(app.getHttpServer());
  const get = (path: string, session?: AuthResult) => {
    const req = http().get(path);
    return session ? req.set("Cookie", cookieHeader(session.cookies)) : req;
  };
  const send = (method: "post" | "patch" | "delete", path: string, session: AuthResult, body?: object) => {
    const req = http()[method](path).set("Cookie", cookieHeader(session.cookies)).set("X-CSRF-Token", CSRF_TOKEN);
    return body ? req.send(body) : req;
  };

  // The wizard's first step, which every role's profile needs before it can go live.
  const PERSONAL_DETAILS = {
    fullName: "Test Person",
    mobileNumber: "9000000000",
    dateOfBirth: "1995-04-12",
    gender: "PREFER_NOT_TO_SAY",
    nationality: "Indian",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
  };
  const STARTUP_INFO = {
    name: "Acme Robotics",
    tagline: "Warehouse robots for small factories",
    description: "We build affordable picking robots.",
    stage: "MVP",
    productStatus: "BETA",
    revenueStatus: "FIRST_REVENUE",
    fundingStatus: "BOOTSTRAPPED",
    industry: "DEEPTECH",
    foundedYear: 2024,
    registrationStatus: "NOT_REGISTERED",
    headquarters: "Bengaluru",
  };
  // Distinctive figures, so a leak of any of them is easy to spot in a response body.
  const TRACTION = { monthlyRevenueAmount: 123457, totalUsers: 42 };
  const FUNDING = { fundingGoalAmount: 5550001, valuationAmount: 40400004, runwayMonths: 7, useOfFunds: "Hire two engineers" };

  /** A founder with a live startup, published through the same route the wizard uses. */
  async function founderWithStartup(overrides: Record<string, unknown> = {}) {
    const founder = await registerViaApi(app, { role: "FOUNDER" });
    const published = await send("post", "/v1/onboarding/publish", founder, {
      acceptedTerms: true,
      signatureFullName: "Test Founder",
      personalDetails: PERSONAL_DETAILS,
      startupInfo: STARTUP_INFO,
      traction: TRACTION,
      funding: FUNDING,
      ...overrides,
    });
    if (published.status !== 201) throw new Error(`publish failed: ${JSON.stringify(published.body)}`);
    return { founder, startup: published.body.data as { id: string; slug: string } };
  }

  async function investorWithProfile() {
    const investor = await registerViaApi(app, { role: "INVESTOR" });
    const published = await send("post", "/v1/onboarding/publish", investor, {
      personalDetails: PERSONAL_DETAILS,
      investorInfo: {
        investorType: "ANGEL",
        bio: "Backs early deep-tech teams.",
        preferredIndustries: ["DEEPTECH"],
        preferredStages: ["MVP"],
        checkSizeMinAmount: 500000,
        checkSizeMaxAmount: 2500000,
        location: "Mumbai",
      },
    });
    if (published.status !== 201) throw new Error(`publish failed: ${JSON.stringify(published.body)}`);
    const user = await testDb.user.findUniqueOrThrow({ where: { email: investor.email } });
    return { investor, investorUserId: user.id };
  }

  // ─── Sessions ──────────────────────────────────────────────────────────

  describe("a session ends everywhere, at once", () => {
    it("signing out stops the cookie that browser already holds", async () => {
      const session = await registerViaApi(app);
      expect((await get("/v1/auth/me", session)).status).toBe(200);

      await send("post", "/v1/auth/logout", session);

      // The access token itself hasn't expired; it is the sign-in behind it that is gone.
      expect((await get("/v1/auth/me", session)).status).toBe(401);
    });

    it("ending a session from another device signs that device out on its next request", async () => {
      const laptop = await registerViaApi(app);
      const phone = await loginViaApi(app, laptop.email, laptop.password);

      const sessions = (await get("/v1/auth/sessions", laptop)).body.data as { id: string; isCurrent: boolean }[];
      expect(sessions).toHaveLength(2);
      const other = sessions.find((item) => !item.isCurrent)!;

      expect((await send("delete", `/v1/auth/sessions/${other.id}`, laptop)).status).toBe(200);

      expect((await get("/v1/auth/me", phone)).status).toBe(401);
      expect((await get("/v1/auth/me", laptop)).status).toBe(200);
    });

    it("changing the password signs out every other device and keeps this one", async () => {
      const laptop = await registerViaApi(app);
      const phone = await loginViaApi(app, laptop.email, laptop.password);

      const changed = await send("post", "/v1/auth/password/change", laptop, {
        currentPassword: laptop.password,
        newPassword: "AnotherPass456!",
      });
      expect(changed.status).toBe(200);

      expect((await get("/v1/auth/me", phone)).status).toBe(401);
      expect((await get("/v1/auth/me", laptop)).status).toBe(200);
    });

    it("refuses a correctly signed token that names no sign-in", async () => {
      const session = await registerViaApi(app);
      const user = await testDb.user.findUniqueOrThrow({ where: { email: session.email } });
      // What every access token looked like before sign-ins were checked on each request.
      const legacy = app
        .get(JwtService, { strict: false })
        .sign({ sub: user.id, email: user.email, role: user.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "15m" });

      const res = await http().get("/v1/auth/me").set("Cookie", `vh_session=${legacy}`);

      expect(res.status).toBe(401);
    });

    it("tells the app whether the account has a password, and never sends the hash", async () => {
      const session = await registerViaApi(app);

      const me = await get("/v1/auth/me", session);

      expect(me.body.data.hasPassword).toBe(true);
      expect(JSON.stringify(me.body)).not.toContain("passwordHash");
      expect(JSON.stringify(me.body)).not.toContain("twoFactorSecret");
    });
  });

  describe("a shared demo account", () => {
    it("shows each visitor only their own session and can't end anyone else's", async () => {
      const first = await registerViaApi(app);
      await testDb.user.update({ where: { email: first.email }, data: { isDemo: true } });
      const second = await loginViaApi(app, first.email, first.password);

      const listed = (await get("/v1/auth/sessions", second)).body.data as { isCurrent: boolean }[];
      expect(listed).toHaveLength(1);
      expect(listed[0]!.isCurrent).toBe(true);

      expect((await send("delete", "/v1/auth/sessions", second)).status).toBe(403);
      expect((await get("/v1/auth/me", first)).status).toBe(200);
    });
  });

  // ─── Account deletion ──────────────────────────────────────────────────

  describe("deleting an account", () => {
    it("needs the password again, then removes the account, its startup and its sign-ins", async () => {
      const { founder, startup } = await founderWithStartup();

      expect((await send("delete", "/v1/users/me", founder)).status).toBe(400);
      expect((await send("delete", "/v1/users/me", founder, { password: "WrongPass999!" })).status).toBe(400);
      expect(await testDb.startup.count()).toBe(1);

      expect((await send("delete", "/v1/users/me", founder, { password: founder.password })).status).toBe(204);

      expect((await get("/v1/auth/me", founder)).status).toBe(401);
      expect((await loginViaApi(app, founder.email, founder.password)).status).toBe(401);
      expect(await testDb.startup.count()).toBe(0);
      expect((await get(`/v1/startups/${startup.slug}`)).status).toBe(404);
    });
  });

  // ─── Onboarding drafts and editing ─────────────────────────────────────

  describe("the onboarding draft", () => {
    it("accepts only the wizard's own sections, within a size limit", async () => {
      const founder = await registerViaApi(app);

      const unknownSection = await send("patch", "/v1/onboarding/draft", founder, { section: "anythingElse", step: 1, data: { a: 1 } });
      const tooBig = await send("patch", "/v1/onboarding/draft", founder, {
        section: "startupInfo",
        step: 1,
        data: { description: "x".repeat(60_000) },
      });
      const fine = await send("patch", "/v1/onboarding/draft", founder, { section: "startupInfo", step: 1, data: { name: "Acme" } });

      expect(unknownSection.status).toBe(400);
      expect(tooBig.status).toBe(400);
      expect(fine.status).toBe(200);
    });
  });

  describe("editing a published profile", () => {
    it("reopens the wizard on the live profile, and saving changes it without a second startup or signature", async () => {
      const { founder } = await founderWithStartup();

      const state = (await get("/v1/onboarding/state", founder)).body.data;
      expect(state.status).toBe("COMPLETED");
      expect(state.pendingEdits).toBe(false);
      expect(state.draft.startupInfo.name).toBe("Acme Robotics");
      expect(state.draft.traction.totalUsers).toBe(42);

      // An autosaved edit is kept as a draft: the account stays "completed", and the wizard knows there are unsaved changes.
      await send("patch", "/v1/onboarding/draft", founder, {
        section: "startupInfo",
        step: 1,
        data: { ...STARTUP_INFO, tagline: "Robots that pay for themselves" },
      });
      const editing = (await get("/v1/onboarding/state", founder)).body.data;
      expect(editing.status).toBe("COMPLETED");
      expect(editing.pendingEdits).toBe(true);
      // The steps that weren't touched are still in the draft, so saving can't blank them.
      expect(editing.draft.traction.totalUsers).toBe(42);

      // No acceptedTerms, no signature: those were given when the profile first went live.
      const saved = await send("post", "/v1/onboarding/publish", founder, {});
      expect(saved.status).toBe(201);

      const startups = await testDb.startup.findMany({ include: { traction: true } });
      expect(startups).toHaveLength(1);
      expect(startups[0]!.tagline).toBe("Robots that pay for themselves");
      expect(startups[0]!.traction?.totalUsers).toBe(42);
      expect((await get("/v1/onboarding/state", founder)).body.data.pendingEdits).toBe(false);
    });

    it("lets unsaved edits be discarded, leaving the live profile as it was", async () => {
      const { founder } = await founderWithStartup();
      await send("patch", "/v1/onboarding/draft", founder, { section: "startupInfo", step: 1, data: { ...STARTUP_INFO, name: "Renamed" } });

      expect((await send("delete", "/v1/onboarding/draft", founder)).status).toBe(200);

      const state = (await get("/v1/onboarding/state", founder)).body.data;
      expect(state.pendingEdits).toBe(false);
      expect(state.draft.startupInfo.name).toBe("Acme Robotics");
    });

    it("still asks a first-time founder to accept the terms and sign", async () => {
      const founder = await registerViaApi(app);

      const res = await send("post", "/v1/onboarding/publish", founder, { personalDetails: PERSONAL_DETAILS, startupInfo: STARTUP_INFO });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/terms/i);
      expect(await testDb.startup.count()).toBe(0);
    });

    it("keeps an investor's account 'completed' when the wizard autosaves after publishing", async () => {
      const { investor } = await investorWithProfile();

      await send("patch", "/v1/onboarding/draft", investor, { section: "investorInfo", step: 1, data: { bio: "Edited" } });

      expect((await get("/v1/onboarding/state", investor)).body.data.status).toBe("COMPLETED");
    });
  });

  // ─── Private startup numbers ───────────────────────────────────────────

  describe("a startup's private numbers", () => {
    const PRIVATE_FIGURES = ["123457", "5550001", "40400004", "Hire two engineers"];
    const expectNoPrivateFigures = (body: unknown) => {
      const text = JSON.stringify(body);
      for (const figure of PRIVATE_FIGURES) expect(text).not.toContain(figure);
    };

    it("are not sent to another founder by the profile, search, discovery or listing routes", async () => {
      const { startup } = await founderWithStartup();
      const otherFounder = await registerViaApi(app, { role: "FOUNDER" });

      const profile = await get(`/v1/startups/${startup.slug}`, otherFounder);
      const search = await get("/v1/search?query=Acme", otherFounder);
      const feed = await get("/v1/discovery/feed", otherFounder);
      const listing = await get("/v1/startups", otherFounder);

      for (const res of [profile, search, feed, listing]) {
        expect(res.status).toBe(200);
        expectNoPrivateFigures(res.body);
      }
      // The startup itself is there: it is the figures that are held back, not the profile.
      expect(JSON.stringify(search.body)).toContain("Acme Robotics");
      expect(JSON.stringify(profile.body)).toContain("Acme Robotics");
    });

    it("are not sent to a signed-out visitor", async () => {
      const { startup } = await founderWithStartup();

      const profile = await get(`/v1/startups/${startup.slug}`);

      expect(profile.status).toBe(200);
      expectNoPrivateFigures(profile.body);
    });

    it("are shown to an investor, who needs them to evaluate the deal", async () => {
      const { startup } = await founderWithStartup();
      const { investor } = await investorWithProfile();

      const profile = await get(`/v1/startups/${startup.slug}`, investor);

      expect(profile.status).toBe(200);
      expect(JSON.stringify(profile.body)).toContain("5550001");
    });

    it("a private startup is not found by anyone but its owner", async () => {
      const { founder, startup } = await founderWithStartup();
      const hidden = await send("patch", "/v1/startups/me/visibility", founder, { visibility: "PRIVATE", metricsVisibility: "BAND" });
      expect(hidden.status).toBe(200);
      const { investor } = await investorWithProfile();

      expect((await get(`/v1/startups/${startup.slug}`, investor)).status).toBe(404);
      expect((await get(`/v1/startups/${startup.slug}`)).status).toBe(404);
      expect(JSON.stringify((await get("/v1/search?query=Acme", investor)).body)).not.toContain("Acme Robotics");
      expect((await get(`/v1/startups/${startup.slug}`, founder)).status).toBe(200);
    });
  });

  // ─── Being found ───────────────────────────────────────────────────────

  describe("who a directory lists", () => {
    it("a profile is listed as soon as it is published, before it has the Verified badge", async () => {
      const { startup } = await founderWithStartup();
      const mentor = await registerViaApi(app, { role: "MENTOR" });
      const published = await send("post", "/v1/onboarding/publish", mentor, {
        personalDetails: PERSONAL_DETAILS,
        mentorInfo: {
          headline: "Pricing for early SaaS",
          expertise: ["Pricing"],
          industries: ["SAAS"],
          yearsExperience: 6,
          availability: "Two evenings a week",
          sessionTypes: ["ONE_ON_ONE"],
          pricingModel: "Free",
          languages: ["English"],
        },
      });
      expect(published.status).toBe(201);
      const { investor } = await investorWithProfile();

      const startups = await get("/v1/startups", investor);
      const mentors = await get("/v1/mentors", investor);

      // Neither has uploaded anything, so neither is verified. They are still there to be found.
      expect((await testDb.startup.findUniqueOrThrow({ where: { id: startup.id } })).verificationStatus).not.toBe("VERIFIED");
      expect(JSON.stringify(startups.body)).toContain("Acme Robotics");
      expect(JSON.stringify(mentors.body)).toContain("Pricing for early SaaS");
    });

    it("verified profiles come first, and 'verified only' still narrows the list", async () => {
      const first = await founderWithStartup();
      const second = await founderWithStartup({ startupInfo: { ...STARTUP_INFO, name: "Beta Looms" } });
      // The older one is the verified one, so it is the badge and not the date that puts it on top.
      await testDb.startup.update({ where: { id: first.startup.id }, data: { verificationStatus: "VERIFIED", verifiedAt: new Date() } });
      const { investor } = await investorWithProfile();

      const everyone = (await get("/v1/startups", investor)).body.data.items as { id: string }[];
      const verifiedOnly = (await get("/v1/startups?verificationStatus=VERIFIED", investor)).body.data.items as { id: string }[];

      expect(everyone.map((item) => item.id)).toEqual([first.startup.id, second.startup.id]);
      expect(verifiedOnly.map((item) => item.id)).toEqual([first.startup.id]);
    });

    it("a profile the automatic checks rejected is never listed, even when asked for by name", async () => {
      const { startup } = await founderWithStartup();
      await testDb.startup.update({ where: { id: startup.id }, data: { verificationStatus: "REJECTED" } });
      const { investor } = await investorWithProfile();

      const byDefault = await get("/v1/startups", investor);
      const askedFor = await get("/v1/startups?verificationStatus=REJECTED", investor);

      expect(byDefault.body.data.items).toHaveLength(0);
      expect(askedFor.body.data.items).toHaveLength(0);
    });
  });

  // ─── Connect requests ──────────────────────────────────────────────────

  describe("connect requests", () => {
    it("stop at the free plan's two a month, even when sent at the same instant", async () => {
      const { founder } = await founderWithStartup();
      const investors = await Promise.all([investorWithProfile(), investorWithProfile(), investorWithProfile(), investorWithProfile()]);

      const results = await Promise.all(
        investors.map(({ investorUserId }) =>
          send("post", "/v1/connections", founder, { recipientId: investorUserId, introduction: "Hello, we build picking robots." }),
        ),
      );

      const statuses = results.map((res) => res.status).sort();
      expect(statuses).toEqual([201, 201, 403, 403]);
      expect(await testDb.connection.count()).toBe(2);
    });

    it("give a founder no way to write to an investor who hasn't accepted", async () => {
      const { founder } = await founderWithStartup();
      const { investor, investorUserId } = await investorWithProfile();
      const created = await send("post", "/v1/connections", founder, { recipientId: investorUserId, introduction: "Hello." });
      const connectionId = created.body.data.id as string;
      const tomorrow = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

      // Pending: no messages and no meeting proposals (a meeting's notes would be a message by another name).
      expect((await send("post", `/v1/connections/${connectionId}/messages`, founder, { body: "Did you see my request?" })).status).toBe(403);
      expect(
        (await send("post", `/v1/connections/${connectionId}/meetings`, founder, { scheduledAt: tomorrow, notes: "Call me" })).status,
      ).toBe(403);

      expect((await send("post", `/v1/connections/${connectionId}/respond`, investor, { action: "ACCEPT" })).status).toBe(201);

      expect((await send("post", `/v1/connections/${connectionId}/messages`, founder, { body: "Thank you for accepting." })).status).toBe(201);
      expect((await send("post", `/v1/connections/${connectionId}/meetings`, founder, { scheduledAt: tomorrow })).status).toBe(201);
    });
  });

  // ─── Verification ──────────────────────────────────────────────────────

  describe("verification badges", () => {
    it("can't be self-awarded by naming someone else's work email", async () => {
      const founder = await registerViaApi(app);
      const user = await testDb.user.findUniqueOrThrow({ where: { email: founder.email } });

      const res = await send("post", "/v1/verification/checks", founder, {
        entityType: "User",
        entityId: user.id,
        field: "workEmail",
        method: "DOMAIN_EMAIL_HEURISTIC",
        input: { email: "partner@a-well-known-fund.com" },
      });

      // The account's own address isn't confirmed, so there is nothing to check yet.
      expect(res.status).toBe(400);
      expect(await testDb.verificationRecord.count({ where: { status: "VERIFIED" } })).toBe(0);
    });

    it("can't be requested for someone else's profile", async () => {
      const { startup } = await founderWithStartup();
      const stranger = await registerViaApi(app);

      const res = await send("post", "/v1/verification/checks", stranger, {
        entityType: "Startup",
        entityId: startup.id,
        field: "cin",
        method: "MCA_API",
        input: { cin: "U12345KA2024PTC000001" },
      });

      expect(res.status).toBe(403);
    });
  });

  // ─── Links ─────────────────────────────────────────────────────────────

  describe("links people can click", () => {
    it("must be http(s): a javascript: address is refused wherever one is saved", async () => {
      const founder = await registerViaApi(app);

      const res = await send("post", "/v1/onboarding/publish", founder, {
        acceptedTerms: true,
        signatureFullName: "Test Founder",
        personalDetails: PERSONAL_DETAILS,
        startupInfo: { ...STARTUP_INFO, website: "javascript:alert(document.cookie)" },
      });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/website/i);
      expect(await testDb.startup.count()).toBe(0);
    });
  });

  // ─── Community ─────────────────────────────────────────────────────────

  describe("community polls", () => {
    it("show how many voted for each option, never who", async () => {
      const author = await registerViaApi(app);
      const voter = await registerViaApi(app);
      const voterUser = await testDb.user.findUniqueOrThrow({ where: { email: voter.email } });
      const posted = await send("post", "/v1/community/posts", author, {
        type: "POLL",
        body: "Which city next?",
        pollOptions: ["Pune", "Jaipur"],
      });
      expect(posted.status).toBe(201);
      const option = await testDb.pollOption.findFirstOrThrow({ where: { label: "Pune" } });

      expect((await send("post", `/v1/community/polls/${option.id}/vote`, voter)).status).toBe(201);
      // A second vote changes nothing: one person, one vote per poll.
      await send("post", `/v1/community/polls/${option.id}/vote`, voter);
      expect(await testDb.pollVote.count()).toBe(1);

      const feed = await get("/v1/community/feed", author);
      const text = JSON.stringify(feed.body);
      expect(text).toContain('"voteCount":1');
      // The voter's id appears nowhere in what the author (or anyone) is sent.
      expect(text).not.toContain(voterUser.id);
    });
  });
});
