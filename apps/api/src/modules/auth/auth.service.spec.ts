import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import { OtpPurpose } from "@vittamhub/types";
import * as argon2 from "argon2";

import type { PrismaService } from "../../database/prisma/prisma.service";
import type { EmailQueueService } from "../jobs/email-queue.service";
import type { UsersService } from "../users/users.service";

import { AuthService, type RequestMeta } from "./auth.service";
import type { CaptchaService } from "./services/captcha.service";
import type { MfaService } from "./services/mfa.service";
import type { OtpService } from "./services/otp.service";
import type { SessionService } from "./services/session.service";

const PASSWORD = "TestPass123!";
const META: RequestMeta = { userAgent: "jest", ipAddress: "127.0.0.1" };

/** Builds an AuthService with jest-mocked collaborators. Argon2 runs for real so password hashing/verification is genuinely exercised. */
function setup() {
  const prisma = {
    user: { create: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      // 1 = only the session just issued, i.e. a sign-in from somewhere new.
      count: jest.fn().mockResolvedValue(1),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    oAuthAccount: { create: jest.fn().mockResolvedValue({}) },
    passwordResetToken: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    mfaRecoveryCode: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    // Interactive transactions run against the same mock.
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((run: (tx: typeof prisma) => unknown) => run(prisma));
  const usersService = { findByEmail: jest.fn(), findByOAuthAccount: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue("signed.jwt.token"), verify: jest.fn() };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue("test-access-secret-at-least-32-chars-long"),
    get: jest.fn().mockReturnValue("15m"),
  };
  const captchaService = { verify: jest.fn().mockResolvedValue(undefined) };
  const otpService = { issue: jest.fn().mockResolvedValue(undefined) };
  const mfaService = { verifyChallenge: jest.fn() };
  const sessionService = { parseDeviceLabel: jest.fn().mockReturnValue("Chrome on macOS") };
  const emailQueueService = { enqueueLoginAlert: jest.fn().mockResolvedValue(undefined) };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    usersService as unknown as UsersService,
    jwtService as unknown as JwtService,
    configService as unknown as ConfigService,
    captchaService as unknown as CaptchaService,
    otpService as unknown as OtpService,
    mfaService as unknown as MfaService,
    sessionService as unknown as SessionService,
    emailQueueService as unknown as EmailQueueService,
  );

  return { service, prisma, usersService, jwtService, captchaService, otpService, mfaService, emailQueueService };
}

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "person@example.com",
    role: "FOUNDER",
    passwordHash: null,
    twoFactorEnabled: false,
    emailVerifiedAt: null,
    isDemo: false,
    deletedAt: null,
    ...overrides,
  };
}

const GOOGLE_PROFILE = {
  email: "person@example.com",
  fullName: "Person",
  provider: "google" as const,
  providerAccountId: "google-123",
};

describe("AuthService", () => {
  describe("register", () => {
    it("hashes the password with Argon2, creates the user, issues an OTP and a session", async () => {
      const { service, prisma, usersService, otpService, captchaService } = setup();
      usersService.findByEmail.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(fakeUser({ passwordHash: "stored" }));
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(
        { email: "person@example.com", password: PASSWORD, fullName: "Person", role: "FOUNDER", acceptedTerms: true },
        META,
      );

      expect(captchaService.verify).toHaveBeenCalled();
      const createArg = prisma.user.create.mock.calls[0][0];
      expect(createArg.data.passwordHash).toMatch(/^\$argon2/); // never a plaintext password
      expect(await argon2.verify(createArg.data.passwordHash, PASSWORD)).toBe(true);
      expect(otpService.issue).toHaveBeenCalledWith("user-1", "person@example.com", OtpPurpose.EMAIL_VERIFICATION);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it("rejects a duplicate email with 409 Conflict", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(fakeUser());

      await expect(
        service.register(
          { email: "person@example.com", password: PASSWORD, fullName: "Person", role: "FOUNDER", acceptedTerms: true },
          META,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("verifies the Argon2 hash and returns a session for valid credentials", async () => {
      const { service, usersService, prisma, emailQueueService } = setup();
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: await argon2.hash(PASSWORD) }));
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.login({ email: "person@example.com", password: PASSWORD, rememberMe: false }, META);

      expect(result).toMatchObject({ mfaRequired: false });
      expect(result).toHaveProperty("accessToken");
      expect(emailQueueService.enqueueLoginAlert).toHaveBeenCalledTimes(1); // login alert is queued, not sent inline
    });

    it("sends no login alert for a browser and network this account has signed in from before", async () => {
      const { service, usersService, prisma, emailQueueService } = setup();
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: await argon2.hash(PASSWORD) }));
      prisma.refreshToken.count.mockResolvedValue(2); // this session plus an earlier one from the same place

      await service.login({ email: "person@example.com", password: PASSWORD, rememberMe: false }, META);

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1); // still recorded
      expect(emailQueueService.enqueueLoginAlert).not.toHaveBeenCalled();
    });

    it("still runs a password check for an unknown email, so timing doesn't reveal which emails exist", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(null);
      const decoy = jest.spyOn(service as unknown as { getDecoyPasswordHash: () => Promise<string> }, "getDecoyPasswordHash");

      await expect(service.login({ email: "nobody@example.com", password: PASSWORD, rememberMe: false }, META)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // The throwaway hash is a real Argon2 hash, so verifying against it costs what a real check costs.
      expect(decoy).toHaveBeenCalledTimes(1);
      expect(await decoy.mock.results[0]!.value).toMatch(/^\$argon2/);
    });

    it("rejects an unknown email with 401", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: "nobody@example.com", password: PASSWORD, rememberMe: false }, META)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects a wrong password with 401", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: await argon2.hash(PASSWORD) }));
      await expect(
        service.login({ email: "person@example.com", password: "WrongPass123!", rememberMe: false }, META),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an OAuth-only account (no password hash) with 401", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: null }));
      await expect(service.login({ email: "person@example.com", password: PASSWORD, rememberMe: false }, META)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects a soft-deleted account with 401", async () => {
      const { service, usersService } = setup();
      usersService.findByEmail.mockResolvedValue(
        fakeUser({ passwordHash: await argon2.hash(PASSWORD), deletedAt: new Date() }),
      );
      await expect(service.login({ email: "person@example.com", password: PASSWORD, rememberMe: false }, META)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("returns an MFA challenge (no session) when 2FA is enabled", async () => {
      const { service, usersService, emailQueueService } = setup();
      usersService.findByEmail.mockResolvedValue(
        fakeUser({ passwordHash: await argon2.hash(PASSWORD), twoFactorEnabled: true }),
      );

      const result = await service.login({ email: "person@example.com", password: PASSWORD, rememberMe: false }, META);

      expect(result).toMatchObject({ mfaRequired: true });
      expect(result).toHaveProperty("challengeToken");
      expect(emailQueueService.enqueueLoginAlert).not.toHaveBeenCalled(); // not logged in yet
    });
  });

  describe("refresh", () => {
    const liveToken = (overrides: Record<string, unknown> = {}) => ({
      id: "rt-1",
      revokedAt: null,
      rotatedAt: null,
      familyId: "family-1",
      expiresAt: new Date(Date.now() + 60_000),
      rememberMe: false,
      user: fakeUser(),
      ...overrides,
    });

    it("rotates the token: retires the old one and issues a new session in the same family", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(liveToken());

      const result = await service.refresh("raw-refresh-token", META);

      // Retired with a conditional update, so two simultaneous requests can't both rotate it.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: "rt-1", revokedAt: null },
        data: { revokedAt: expect.any(Date), rotatedAt: expect.any(Date), familyId: "family-1" },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ familyId: "family-1" }) }),
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("answers a second request for a token rotated a moment ago with an access token only", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveToken({ revokedAt: new Date(), rotatedAt: new Date(Date.now() - 2_000) }),
      );
      prisma.refreshToken.count.mockResolvedValue(1); // the successor is still live

      const result = await service.refresh("raw", META);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeUndefined(); // the browser keeps the cookie the winning request set
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it("treats a rotated token used again later as stolen: ends that whole sign-in", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveToken({ revokedAt: new Date(Date.now() - 600_000), rotatedAt: new Date(Date.now() - 600_000) }),
      );
      prisma.refreshToken.count.mockResolvedValue(1);

      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("never renews a token that was signed out, even within the grace period", async () => {
      const { service, prisma } = setup();
      // Rotated two seconds ago, but the person has since signed out: nothing in the family is live.
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveToken({ revokedAt: new Date(), rotatedAt: new Date(Date.now() - 2_000) }),
      );
      prisma.refreshToken.count.mockResolvedValue(0);

      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a missing refresh token with 401", async () => {
      const { service } = setup();
      await expect(service.refresh(undefined, META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an unknown refresh token with 401", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh("nope", META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an already-revoked refresh token with 401", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(liveToken({ revokedAt: new Date() }));
      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("rejects an expired refresh token with 401", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(liveToken({ expiresAt: new Date(Date.now() - 60_000) }));
      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a refresh token belonging to a deleted account with 401", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue(liveToken({ user: fakeUser({ deletedAt: new Date() }) }));
      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("findOrCreateOAuthUser", () => {
    it("refuses a provider profile with no verified email", async () => {
      const { service, prisma, usersService } = setup();
      await expect(service.findOrCreateOAuthUser({ ...GOOGLE_PROFILE, email: undefined }, META)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("signs in the account already linked to that provider account", async () => {
      const { service, prisma, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date() }));

      const result = await service.findOrCreateOAuthUser(GOOGLE_PROFILE, META);

      expect(result).toMatchObject({ mfaRequired: false });
      expect(prisma.oAuthAccount.create).not.toHaveBeenCalled();
    });

    it("links to an existing account whose email is confirmed and leaves its password alone", async () => {
      const { service, prisma, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: "stored", emailVerifiedAt: new Date() }));

      const result = await service.findOrCreateOAuthUser(GOOGLE_PROFILE, META);

      expect(result).toMatchObject({ mfaRequired: false });
      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: { userId: "user-1", provider: "google", providerAccountId: "google-123" },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("takes over an account that never confirmed its email: password, sessions and two-factor are cleared", async () => {
      const { service, prisma, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(null);
      // Someone signed up with this address and a password of their own, and never proved they own it.
      usersService.findByEmail.mockResolvedValue(fakeUser({ passwordHash: "set-by-someone-else", twoFactorEnabled: true }));
      prisma.user.update.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date() }));

      const result = await service.findOrCreateOAuthUser(GOOGLE_PROFILE, META);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { emailVerifiedAt: expect.any(Date), passwordHash: null, twoFactorEnabled: false, twoFactorSecret: null },
      });
      // Every session the earlier holder had is ended before the new one is issued.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toMatchObject({ mfaRequired: false });
    });

    it("asks for the second factor instead of signing in when the account has two-factor on", async () => {
      const { service, prisma, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date(), twoFactorEnabled: true }));

      const result = await service.findOrCreateOAuthUser(GOOGLE_PROFILE, META);

      expect(result).toMatchObject({ mfaRequired: true });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("refuses a deleted account and a demo account", async () => {
      const { service, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(fakeUser({ deletedAt: new Date() }));
      await expect(service.findOrCreateOAuthUser(GOOGLE_PROFILE, META)).rejects.toBeInstanceOf(UnauthorizedException);

      usersService.findByOAuthAccount.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(fakeUser({ isDemo: true, emailVerifiedAt: new Date() }));
      await expect(service.findOrCreateOAuthUser(GOOGLE_PROFILE, META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("creates a new, email-verified founder account when nothing matches", async () => {
      const { service, prisma, usersService } = setup();
      usersService.findByOAuthAccount.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date() }));

      await service.findOrCreateOAuthUser(GOOGLE_PROFILE, META);

      const created = prisma.user.create.mock.calls[0][0].data;
      expect(created).toMatchObject({ email: "person@example.com", role: "FOUNDER", emailVerifiedAt: expect.any(Date) });
      expect(created.passwordHash).toBeUndefined();
    });
  });

  describe("logout", () => {
    it("revokes the session for the given refresh token, along with the rest of that sign-in", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({ id: "rt-1", familyId: "family-1" });
      await service.logout("raw-refresh-token");
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("revokes just that token when it predates sign-in families", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({ id: "rt-1", familyId: null });
      await service.logout("raw-refresh-token");
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: "rt-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("is a no-op when no refresh token is present", async () => {
      const { service, prisma } = setup();
      await service.logout(undefined);
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
