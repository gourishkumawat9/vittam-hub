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
    user: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
    refreshToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
    oAuthAccount: { create: jest.fn() },
  };
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
    deletedAt: null,
    ...overrides,
  };
}

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
    it("rotates the token: revokes the old one and issues a new session", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        rememberMe: false,
        user: fakeUser(),
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh("raw-refresh-token", META);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "rt-1" }, data: { revokedAt: expect.any(Date) } }),
      );
      expect(result.accessToken).toBeDefined();
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
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        rememberMe: false,
        user: fakeUser(),
      });
      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an expired refresh token with 401", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
        rememberMe: false,
        user: fakeUser(),
      });
      await expect(service.refresh("raw", META)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("revokes the session for the given refresh token", async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      await service.logout("raw-refresh-token");
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revokedAt: expect.any(Date) } }),
      );
    });

    it("is a no-op when no refresh token is present", async () => {
      const { service, prisma } = setup();
      await service.logout(undefined);
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
