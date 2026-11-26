import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { DEMO_ACCOUNTS, DemoAccountsService } from "../src/modules/demo/demo-accounts.service";

import { buildTestApp } from "./support/app";
import { CSRF_TOKEN, cookieHeader, loginViaApi, registerViaApi, type AuthResult } from "./support/auth";
import { testDb, truncateAll } from "./support/database";

/**
 * What a profile can do after it is live: be saved again, and earn the
 * Verified badge. Against the real HTTP surface and a real database.
 */
describe("Profiles (e2e)", () => {
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
  const get = (path: string, session: AuthResult) => http().get(path).set("Cookie", cookieHeader(session.cookies));
  const post = (path: string, session: AuthResult, body: object) =>
    http().post(path).set("Cookie", cookieHeader(session.cookies)).set("X-CSRF-Token", CSRF_TOKEN).send(body);

  /** The engine recomputes a moment after the request that caused it, so the status is polled rather than read once. */
  async function eventually<T>(read: () => Promise<T>, wanted: T): Promise<T> {
    let value = await read();
    for (let attempt = 0; attempt < 40 && value !== wanted; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      value = await read();
    }
    return value;
  }

  const PERSONAL_DETAILS = {
    fullName: "Test Person",
    mobileNumber: "9000000000",
    dateOfBirth: "1995-04-12",
    gender: "PREFER_NOT_TO_SAY",
    nationality: "Indian",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
  };

  describe("the demo accounts", () => {
    const DEMO_PASSWORD = "a-long-demo-password";

    it("can each open Edit profile and save it as it stands", async () => {
      await app.get(DemoAccountsService).sync(DEMO_PASSWORD);

      for (const account of DEMO_ACCOUNTS) {
        const session = await loginViaApi(app, account.email, DEMO_PASSWORD);
        expect(session.status).toBe(200);

        const state = (await get("/v1/onboarding/state", session)).body.data;
        expect(state.status).toBe("COMPLETED");
        expect(state.pendingEdits).toBe(false);

        // Nothing changed, nothing sent: the wizard's "Save" on an untouched profile.
        const saved = await post("/v1/onboarding/publish", session, {});
        expect({ email: account.email, status: saved.status, body: saved.status === 201 ? null : saved.body }).toEqual({
          email: account.email,
          status: 201,
          body: null,
        });
      }
    });

    it("drop a visitor's unsaved edits when the demo logins are refreshed", async () => {
      const demo = app.get(DemoAccountsService);
      await demo.sync(DEMO_PASSWORD);
      const founder = DEMO_ACCOUNTS[0]!;
      const session = await loginViaApi(app, founder.email, DEMO_PASSWORD);
      const state = (await get("/v1/onboarding/state", session)).body.data;
      await http()
        .patch("/v1/onboarding/draft")
        .set("Cookie", cookieHeader(session.cookies))
        .set("X-CSRF-Token", CSRF_TOKEN)
        .send({ section: "startupInfo", step: 1, data: { ...state.draft.startupInfo, name: "Defaced" } });
      expect((await get("/v1/onboarding/state", session)).body.data.pendingEdits).toBe(true);

      await demo.sync(DEMO_PASSWORD);

      const after = (await get("/v1/onboarding/state", await loginViaApi(app, founder.email, DEMO_PASSWORD))).body.data;
      expect(after.pendingEdits).toBe(false);
      expect(after.draft.startupInfo.name).toBe("Demo Startup");
    });
  });

  describe("the Verified badge", () => {
    it("lists what a profile still needs, and a university's status now moves as it adds them", async () => {
      const university = await registerViaApi(app, { role: "UNIVERSITY" });
      const user = await testDb.user.findUniqueOrThrow({ where: { email: university.email } });

      // Before there is a profile there is nothing to verify.
      expect((await get("/v1/verification/mine", university)).body.data).toBeNull();

      const profile = {
        personalDetails: PERSONAL_DETAILS,
        universityInfo: {
          institutionName: "Test Institute of Technology",
          designation: "E-cell coordinator",
          affiliationType: "STATE_PRIVATE_UNIVERSITY",
          city: "Jaipur",
          departments: ["Engineering"],
        },
      };
      expect((await post("/v1/onboarding/publish", university, profile)).status).toBe(201);

      const before = (await get("/v1/verification/mine", university)).body.data;
      expect(before.entityType).toBe("UniversityProfile");
      expect(before.status).toBe("PENDING");
      expect(before.requirements).toEqual([
        expect.objectContaining({ key: "registration", met: false, documentType: "INCORPORATION_CERTIFICATE" }),
        expect.objectContaining({ key: "details", met: true }),
      ]);
      // Universities were the one profile whose stored status never changed at all.
      const stored = () => testDb.universityProfile.findUniqueOrThrow({ where: { ownerId: user.id } }).then((row) => row.verificationStatus);
      expect(await eventually(stored, "PENDING")).toBe("PENDING");

      // The certificate arrives (the upload itself goes to storage, which the tests don't have).
      await testDb.document.create({
        data: { userId: user.id, type: "INCORPORATION_CERTIFICATE", fileUrl: "https://storage.test/documents/certificate.pdf", fileName: "certificate.pdf" },
      });
      expect((await post("/v1/onboarding/publish", university, {})).status).toBe(201);

      const after = (await get("/v1/verification/mine", university)).body.data;
      expect(after.status).toBe("VERIFIED");
      expect(after.requirements.every((requirement: { met: boolean }) => requirement.met)).toBe(true);
      expect(await eventually(stored, "VERIFIED")).toBe("VERIFIED");
    });

    it("is one account's own business: the list is always the caller's", async () => {
      const mentor = await registerViaApi(app, { role: "MENTOR" });
      const published = await post("/v1/onboarding/publish", mentor, {
        personalDetails: PERSONAL_DETAILS,
        mentorInfo: {
          headline: "Pricing for early SaaS",
          expertise: ["Pricing"],
          industries: ["SAAS"],
          yearsExperience: 6,
          availability: "Two evenings a week",
          sessionTypes: ["ONE_ON_ONE"],
          languages: ["English"],
          mentorType: "FOUNDER_OPERATOR",
          stagesHelped: ["IDEA", "MVP"],
          meetingMode: "ONLINE",
          feeType: "FREE",
        },
      });
      expect(published.status).toBe(201);
      const stranger = await registerViaApi(app, { role: "FOUNDER" });

      expect((await get("/v1/verification/mine", mentor)).body.data.entityType).toBe("MentorProfile");
      expect((await get("/v1/verification/mine", stranger)).body.data).toBeNull();
      expect((await http().get("/v1/verification/mine")).status).toBe(401);
    });
  });
});
