import { createHash, randomBytes } from "node:crypto";

import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OtpPurpose, UserRole, type LoginInput, type RegisterInput } from "@vittamhub/types";
import * as argon2 from "argon2";

import { PrismaService } from "../../database/prisma/prisma.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { UsersService } from "../users/users.service";

import { CaptchaService } from "./services/captcha.service";
import { MfaService } from "./services/mfa.service";
import { OtpService } from "./services/otp.service";
import { SessionService } from "./services/session.service";

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
}

interface OAuthProfile {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  provider: string;
  providerAccountId: string;
}

const MFA_CHALLENGE_TTL = "5m";
const MFA_CHALLENGE_PURPOSE = "mfa_challenge";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
    private readonly otpService: OtpService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async register(input: RegisterInput, meta: RequestMeta) {
    await this.captchaService.verify(input.captchaToken);

    const existing = await this.usersService.findByEmail(input.email);
    if (existing) throw new ConflictException("An account with this email already exists");

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        profile: { create: {} },
      },
    });

    await this.otpService.issue(user.id, user.email, OtpPurpose.EMAIL_VERIFICATION);

    const session = await this.issueSession(user.id, user.email, user.role, meta);
    return { ...session, user };
  }

  async login(input: LoginInput, meta: RequestMeta) {
    await this.captchaService.verify(input.captchaToken);

    const user = await this.usersService.findByEmail(input.email);
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.deletedAt) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.twoFactorEnabled) {
      const challengeToken = this.jwtService.sign(
        { sub: user.id, purpose: MFA_CHALLENGE_PURPOSE },
        { secret: this.configService.getOrThrow("JWT_ACCESS_SECRET"), expiresIn: MFA_CHALLENGE_TTL },
      );
      return { mfaRequired: true as const, challengeToken };
    }

    const session = await this.issueSession(user.id, user.email, user.role, meta);
    await this.recordLogin(user.id, user.email, meta);
    return { mfaRequired: false as const, ...session, user };
  }

  async completeMfaChallenge(challengeToken: string, code: string, meta: RequestMeta) {
    const userId = this.verifyMfaChallengeToken(challengeToken);
    const isValid = await this.mfaService.verifyChallenge(userId, code);
    if (!isValid) throw new UnauthorizedException("Invalid or expired code");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const session = await this.issueSession(user.id, user.email, user.role, meta);
    await this.recordLogin(user.id, user.email, meta);
    return { ...session, user };
  }

  /**
   * Finds an existing account by OAuth link (or by matching email, linking
   * the new provider to it), or creates one. New accounts default to
   * FOUNDER — the most common self-serve signup — and can be corrected via
   * the account-type step; see docs/09-authentication-security.md for why
   * full OAuth `state`-based role passthrough was deferred.
   */
  async findOrCreateOAuthUser(profile: OAuthProfile, meta: RequestMeta) {
    if (!profile.email) {
      throw new UnauthorizedException(`${profile.provider} did not share an email address`);
    }

    const existingByOAuth = await this.usersService.findByOAuthAccount(profile.provider, profile.providerAccountId);
    if (existingByOAuth) {
      if (existingByOAuth.deletedAt) throw new UnauthorizedException("This account is no longer available");
      return this.issueSession(existingByOAuth.id, existingByOAuth.email, existingByOAuth.role, meta);
    }

    const existingByEmail = await this.usersService.findByEmail(profile.email);
    if (existingByEmail) {
      if (existingByEmail.deletedAt) throw new UnauthorizedException("This account is no longer available");
      await this.prisma.oAuthAccount.create({
        data: { userId: existingByEmail.id, provider: profile.provider, providerAccountId: profile.providerAccountId },
      });
      return this.issueSession(existingByEmail.id, existingByEmail.email, existingByEmail.role, meta);
    }

    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        fullName: profile.fullName ?? profile.email.split("@")[0]!,
        avatarUrl: profile.avatarUrl,
        role: UserRole.FOUNDER,
        emailVerifiedAt: new Date(), // the OAuth provider already verified this address
        profile: { create: {} },
        oauthAccounts: { create: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
      },
    });

    return this.issueSession(user.id, user.email, user.role, meta);
  }

  async refresh(rawRefreshToken: string | undefined, meta: RequestMeta) {
    if (!rawRefreshToken) throw new UnauthorizedException("No refresh token provided");

    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired — please log in again");
    }

    // Rotate: revoke the used token and issue a new pair (mitigates replay of stolen refresh tokens).
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueSession(stored.user.id, stored.user.email, stored.user.role, {
      ...meta,
      rememberMe: stored.rememberMe,
    });
  }

  /** Revokes only the session tied to this refresh token — other devices stay logged in. Use SessionService.revokeAllOtherSessions for "log out everywhere". */
  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawRefreshToken) },
      data: { revokedAt: new Date() },
    });
  }

  private async issueSession(userId: string, email: string, role: string, meta: RequestMeta) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get("JWT_ACCESS_TTL", "15m"),
    });

    const rawRefreshToken = randomBytes(48).toString("hex");
    const rememberMe = meta.rememberMe ?? false;
    // "Remember me" = the full 30-day refresh TTL; otherwise the session ends in 1 day
    // regardless of the cookie's own maxAge, so an unattended shared browser tab still expires.
    const refreshTtlMs = rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24;

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawRefreshToken),
        deviceLabel: this.sessionService.parseDeviceLabel(meta.userAgent),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        rememberMe,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, rememberMe };
  }

  private verifyMfaChallengeToken(token: string): string {
    try {
      const payload = this.jwtService.verify<{ sub: string; purpose: string }>(token, {
        secret: this.configService.getOrThrow("JWT_ACCESS_SECRET"),
      });
      if (payload.purpose !== MFA_CHALLENGE_PURPOSE) throw new Error("wrong token purpose");
      return payload.sub;
    } catch {
      throw new UnauthorizedException("This verification step has expired — please log in again");
    }
  }

  private hashToken(rawToken: string) {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Audit trail write is awaited (cheap, local); the login-alert email is
   * queued (BullMQ, see modules/jobs) rather than sent inline, so a slow or
   * down email provider never delays the login response — and unlike a bare
   * fire-and-forget promise, a failed send gets retried instead of silently
   * dropped.
   */
  private async recordLogin(userId: string, email: string, meta: RequestMeta): Promise<void> {
    await this.prisma.auditLog.create({
      data: { actorId: userId, action: "auth.login", entityType: "User", entityId: userId, ipAddress: meta.ipAddress },
    });

    const deviceLabel = this.sessionService.parseDeviceLabel(meta.userAgent);
    await this.emailQueueService.enqueueLoginAlert({
      email,
      deviceLabel,
      ipAddress: meta.ipAddress ?? "unknown",
      timestamp: new Date().toUTCString(),
    });
  }
}
