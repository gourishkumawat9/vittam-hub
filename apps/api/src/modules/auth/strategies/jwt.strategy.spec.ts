import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { UserRole } from "@vittamhub/types";

import type { PrismaService } from "../../../database/prisma/prisma.service";

import { JwtStrategy } from "./jwt.strategy";

const USER_ID = "3f0a4c5e-8f1b-4d2a-9c3e-1a2b3c4d5e6f";
const SESSION_ID = "9b1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f";

function setup() {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue("test-access-secret-at-least-32-chars-long"),
  };
  const prisma = {
    refreshToken: {
      // The sign-in is still open, and the account says FOUNDER.
      findFirst: jest.fn().mockResolvedValue({ user: { email: "founder@example.com", role: UserRole.FOUNDER } }),
    },
  };
  const strategy = new JwtStrategy(configService as unknown as ConfigService, prisma as unknown as PrismaService);
  return { strategy, prisma };
}

const sessionPayload = (overrides: Record<string, unknown> = {}) => ({
  sub: USER_ID,
  email: "founder@example.com",
  role: UserRole.FOUNDER,
  sid: SESSION_ID,
  ...overrides,
});

describe("JwtStrategy.validate", () => {
  it("accepts a well-formed session payload whose sign-in is still open", async () => {
    const { strategy, prisma } = setup();

    await expect(strategy.validate(sessionPayload())).resolves.toEqual({
      sub: USER_ID,
      email: "founder@example.com",
      role: UserRole.FOUNDER,
    });
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        familyId: SESSION_ID,
        userId: USER_ID,
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
        user: { deletedAt: null },
      },
      select: { user: { select: { email: true, role: true } } },
    });
  });

  it("rejects a token whose sign-in has ended (signed out, password changed, session revoked, account deleted)", async () => {
    const { strategy, prisma } = setup();
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(sessionPayload())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("takes the role and email from the account, not from the token", async () => {
    const { strategy, prisma } = setup();
    prisma.refreshToken.findFirst.mockResolvedValue({ user: { email: "new@example.com", role: UserRole.MENTOR } });

    await expect(strategy.validate(sessionPayload({ role: UserRole.ADMIN }))).resolves.toEqual({
      sub: USER_ID,
      email: "new@example.com",
      role: UserRole.MENTOR,
    });
  });

  it("rejects a token from before sign-ins were checked on every request (no sid), without a database lookup", async () => {
    const { strategy, prisma } = setup();

    await expect(strategy.validate(sessionPayload({ sid: undefined }))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
  });

  it("rejects ids that are not UUIDs instead of handing them to the database", async () => {
    const { strategy, prisma } = setup();

    await expect(strategy.validate(sessionPayload({ sid: "not-a-uuid" }))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(strategy.validate(sessionPayload({ sub: "user-1" }))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
  });

  /**
   * Regression test for a real MFA bypass: the challenge token issued by
   * AuthService.login() before the second factor is verified was previously
   * accepted here as a valid session, because validate() returned the raw
   * payload unchecked.
   */
  it("rejects an MFA challenge token being replayed as a session token", async () => {
    const { strategy, prisma } = setup();

    await expect(strategy.validate({ sub: USER_ID, purpose: "mfa_challenge" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
  });

  it("rejects any token carrying a purpose claim, whatever its value", async () => {
    const { strategy } = setup();

    await expect(strategy.validate(sessionPayload({ purpose: "something-else" }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects a payload missing email", async () => {
    const { strategy } = setup();
    await expect(strategy.validate(sessionPayload({ email: undefined }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a payload whose role is not a real UserRole", async () => {
    const { strategy } = setup();
    await expect(strategy.validate(sessionPayload({ role: "SUPERADMIN" }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
