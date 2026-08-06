import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import { CsrfGuard } from "./csrf.guard";

function makeContext(method: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, cookies, headers }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function setup(skip = false) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(skip) };
  const guard = new CsrfGuard(reflector as unknown as Reflector);
  return { guard, reflector };
}

describe("CsrfGuard", () => {
  it("allows safe methods (GET/HEAD/OPTIONS) through without any token check", () => {
    const { guard } = setup();
    expect(guard.canActivate(makeContext("GET"))).toBe(true);
    expect(guard.canActivate(makeContext("HEAD"))).toBe(true);
    expect(guard.canActivate(makeContext("OPTIONS"))).toBe(true);
  });

  it("allows a mutating request through when @SkipCsrf() is set, even with no token at all", () => {
    const { guard } = setup(true);
    expect(guard.canActivate(makeContext("POST"))).toBe(true);
  });

  it("rejects a mutating request with no CSRF cookie or header at all", () => {
    const { guard } = setup();
    expect(() => guard.canActivate(makeContext("POST"))).toThrow(ForbiddenException);
  });

  it("rejects when the header is missing but the cookie is present", () => {
    const { guard } = setup();
    expect(() => guard.canActivate(makeContext("POST", { csrf_token: "abc123" }))).toThrow(ForbiddenException);
  });

  it("rejects when the cookie and header values don't match — the actual forgery case", () => {
    const { guard } = setup();
    expect(() =>
      guard.canActivate(makeContext("POST", { csrf_token: "real-token" }, { "x-csrf-token": "attacker-guess" })),
    ).toThrow(ForbiddenException);
  });

  it("allows a mutating request through when the cookie and header match", () => {
    const { guard } = setup();
    expect(
      guard.canActivate(makeContext("DELETE", { csrf_token: "matching-token" }, { "x-csrf-token": "matching-token" })),
    ).toBe(true);
  });
});
