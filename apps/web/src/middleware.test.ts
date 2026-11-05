import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

const inAnHour = Math.floor(Date.now() / 1000) + 3600;

function visit(path: string, cookies: Record<string, string> = {}) {
  const request = new NextRequest(`https://vittamhub.com${path}`, {
    headers: { cookie: Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join("; ") },
  });
  const response = middleware(request);
  const location = response.headers.get("location");
  return location ? new URL(location).pathname + new URL(location).search : null;
}

describe("middleware", () => {
  it("sends signed-out visitors of a dashboard to login", () => {
    expect(visit("/founder/analytics")).toBe("/login?redirectTo=%2Ffounder%2Fanalytics");
  });

  it("lets a visitor with only a refresh cookie through so the session can be renewed", () => {
    expect(visit("/founder", { vh_refresh: "abc" })).toBeNull();
  });

  it("treats an expired session cookie as signed out", () => {
    expect(visit("/investor", { vh_session: jwt({ role: "INVESTOR", exp: 1 }) })).toBe("/login?redirectTo=%2Finvestor");
  });

  it("sends a signed-in investor from /login to the investor dashboard, not the founder one", () => {
    expect(visit("/login", { vh_session: jwt({ role: "INVESTOR", exp: inAnHour }) })).toBe("/investor");
  });

  it("keeps founders out of the investor and admin areas", () => {
    const founder = { vh_session: jwt({ role: "FOUNDER", exp: inAnHour }) };
    expect(visit("/investor/discover", founder)).toBe("/founder");
    expect(visit("/admin", founder)).toBe("/founder");
    expect(visit("/founder", founder)).toBeNull();
  });

  it("lets admins open every area", () => {
    const admin = { vh_session: jwt({ role: "ADMIN", exp: inAnHour }) };
    expect(visit("/investor", admin)).toBeNull();
    expect(visit("/founder", admin)).toBeNull();
  });

  it("ignores a malformed session cookie", () => {
    expect(visit("/login", { vh_session: "not-a-jwt" })).toBeNull();
  });
});
