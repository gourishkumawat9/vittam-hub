import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { UserRole } from "@vittamhub/types";

import { JwtStrategy } from "./jwt.strategy";

function setup() {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue("test-access-secret-at-least-32-chars-long"),
  };
  return new JwtStrategy(configService as unknown as ConfigService);
}

describe("JwtStrategy.validate", () => {
  it("accepts a well-formed session payload", () => {
    const strategy = setup();
    const payload = { sub: "user-1", email: "founder@example.com", role: UserRole.FOUNDER };

    expect(strategy.validate(payload)).toEqual(payload);
  });

  /**
   * Regression test for a real MFA bypass: the challenge token issued by
   * AuthService.login() before the second factor is verified was previously
   * accepted here as a valid session, because validate() returned the raw
   * payload unchecked.
   */
  it("rejects an MFA challenge token being replayed as a session token", () => {
    const strategy = setup();
    const challengePayload = { sub: "user-1", purpose: "mfa_challenge" } as never;

    expect(() => strategy.validate(challengePayload)).toThrow(UnauthorizedException);
  });

  it("rejects any token carrying a purpose claim, whatever its value", () => {
    const strategy = setup();
    const payload = { sub: "user-1", email: "a@b.com", role: UserRole.FOUNDER, purpose: "something-else" };

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });

  it("rejects a payload missing email", () => {
    const strategy = setup();
    expect(() => strategy.validate({ sub: "user-1", role: UserRole.FOUNDER } as never)).toThrow(UnauthorizedException);
  });

  it("rejects a payload whose role is not a real UserRole", () => {
    const strategy = setup();
    expect(() => strategy.validate({ sub: "user-1", email: "a@b.com", role: "SUPERADMIN" } as never)).toThrow(
      UnauthorizedException,
    );
  });
});
