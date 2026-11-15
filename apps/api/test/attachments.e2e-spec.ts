import { randomUUID } from "node:crypto";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { buildTestApp } from "./support/app";
import { CSRF_TOKEN, cookieHeader, registerViaApi, type AuthResult } from "./support/auth";
import { testDb, truncateAll } from "./support/database";

/**
 * Files attached to a connect request. Storage itself isn't reachable from
 * the tests, but nothing here needs it: signing a link is local, and the
 * rules are about whose file may be attached and who may open it.
 */
const STORAGE = {
  STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  STORAGE_BUCKET: "vittamhub-docs",
  STORAGE_PUBLIC_BUCKET: "vittamhub-media",
  STORAGE_ACCESS_KEY_ID: "test-key",
  STORAGE_SECRET_ACCESS_KEY: "test-secret",
  STORAGE_PUBLIC_CDN_URL: "https://media.vittamhub.com",
};

describe("Connect request attachments (e2e)", () => {
  let app: INestApplication;
  const saved: Record<string, string | undefined> = {};

  beforeAll(async () => {
    for (const [key, value] of Object.entries(STORAGE)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await testDb.$disconnect();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(async () => {
    await truncateAll();
  });

  const http = () => request(app.getHttpServer());
  const get = (path: string, session: AuthResult) => http().get(path).set("Cookie", cookieHeader(session.cookies));
  const post = (path: string, session: AuthResult, body: object) =>
    http().post(path).set("Cookie", cookieHeader(session.cookies)).set("X-CSRF-Token", CSRF_TOKEN).send(body);

  const PERSONAL_DETAILS = {
    fullName: "Test Person",
    mobileNumber: "9000000000",
    dateOfBirth: "1995-04-12",
    gender: "PREFER_NOT_TO_SAY",
    nationality: "Indian",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
  };

  const userId = async (session: AuthResult) => (await testDb.user.findUniqueOrThrow({ where: { email: session.email } })).id;
  const storedFile = (ownerId: string) => `${STORAGE.STORAGE_ENDPOINT}/${STORAGE.STORAGE_BUCKET}/documents/${ownerId}/${randomUUID()}`;

  async function founderAndInvestor() {
    const founder = await registerViaApi(app, { role: "FOUNDER" });
    const published = await post("/v1/onboarding/publish", founder, {
      acceptedTerms: true,
      signatureFullName: "Test Founder",
      personalDetails: PERSONAL_DETAILS,
      startupInfo: {
        name: "Acme Robotics",
        tagline: "Warehouse robots",
        description: "Picking robots.",
        stage: "MVP",
        productStatus: "BETA",
        revenueStatus: "NONE",
        fundingStatus: "BOOTSTRAPPED",
        industry: "DEEPTECH",
        foundedYear: 2024,
        registrationStatus: "NOT_REGISTERED",
        headquarters: "Pune",
      },
    });
    expect(published.status).toBe(201);
    const investor = await registerViaApi(app, { role: "INVESTOR" });
    return { founder, investor, investorId: await userId(investor) };
  }

  it("lets the founder attach their own upload, and both sides open it through a short-lived link", async () => {
    const { founder, investor, investorId } = await founderAndInvestor();
    const deck = storedFile(await userId(founder));

    const sent = await post("/v1/connections", founder, { recipientId: investorId, introduction: "Hello.", pitchDeckUrl: deck });
    expect(sent.status).toBe(201);
    const id = sent.body.data.id as string;

    for (const member of [investor, founder]) {
      const opened = await get(`/v1/connections/${id}/attachments/pitch-deck`, member);
      expect(opened.status).toBe(200);
      const url = new URL(opened.body.data.url);
      // A signed link to the private bucket, not the stored address (which answers "access denied").
      expect(url.searchParams.get("X-Amz-Signature")).toBeTruthy();
      expect(Number(url.searchParams.get("X-Amz-Expires"))).toBeLessThanOrEqual(300);
    }
  });

  it("refuses someone else's stored file as an attachment", async () => {
    const { founder, investorId } = await founderAndInvestor();
    const someoneElse = storedFile(randomUUID());

    const sent = await post("/v1/connections", founder, { recipientId: investorId, introduction: "Hello.", pitchDeckUrl: someoneElse });

    expect(sent.status).toBe(400);
    expect(await testDb.connection.count()).toBe(0);
  });

  it("opens only for the two people on the request", async () => {
    const { founder, investorId } = await founderAndInvestor();
    const sent = await post("/v1/connections", founder, {
      recipientId: investorId,
      introduction: "Hello.",
      pitchDeckUrl: storedFile(await userId(founder)),
    });
    const stranger = await registerViaApi(app, { role: "INVESTOR" });

    const res = await get(`/v1/connections/${sent.body.data.id}/attachments/pitch-deck`, stranger);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("X-Amz-Signature");
  });

  it("passes a pasted link through as it is, and says when nothing is attached", async () => {
    const { founder, investor, investorId } = await founderAndInvestor();
    const sent = await post("/v1/connections", founder, {
      recipientId: investorId,
      introduction: "Hello.",
      pitchDeckUrl: "https://docs.example.com/acme-deck",
    });
    const id = sent.body.data.id as string;

    expect((await get(`/v1/connections/${id}/attachments/pitch-deck`, investor)).body.data.url).toBe("https://docs.example.com/acme-deck");
    expect((await get(`/v1/connections/${id}/attachments/executive-summary`, investor)).status).toBe(404);
    expect((await get(`/v1/connections/${id}/attachments/anything-else`, investor)).status).toBe(404);
  });
});
