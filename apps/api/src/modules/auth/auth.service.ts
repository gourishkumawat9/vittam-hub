import { createHash, randomBytes, randomUUID } from "node:crypto";

import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma, type User } from "@prisma/client";
import { OtpPurpose, UserRole, type LoginInput, type RegisterInput } from "@vittamhub/types";
import * as argon2 from "argon2";

import { PrismaService } from "../../database/prisma/prisma.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { UsersService } from "../users/users.service";

import type { OAuthProfile } from "./oauth/oauth-providers";
import { OAuthSignInException } from "./oauth/oauth.guard";
import { CaptchaService } from "./services/captcha.service";
import { MfaService } from "./services/mfa.service";
import { OtpService } from "./services/otp.service";
import { revokeUserSessions } from "./services/session-revocation";
import { SessionService } from "./services/session.service";

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
}

const MFA_CHALLENGE_TTL = "5m";
const MFA_CHALLENGE_PURPOSE = "mfa_challenge";

/**
 * How long a refresh token that was just exchanged is still answered. Two
 * tabs (or two requests from one page) can ask to renew with the same token
 * at the same moment; without this the slower one was told the session had
 * ended and the browser was signed out. Past this window, a second use of an
 * exchanged token can only be a copy of it, and is treated as theft.
 */
const REFRESH_REUSE_GRACE_MS = 30_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private decoyPasswordHash?: Promise<string>;

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
    await this.captchaService.verify(input.captchaToken, meta.ipAddress);

    const alreadyRegistered = new ConflictException("An account with this email already exists");
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) throw alreadyRegistered;

    const passwordHash = await argon2.hash(input.password);
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          role: input.role,
          profile: { create: {} },
        },
      });
    } catch (error) {
      // A double-click sends two sign-ups at once: both pass the check above and the second hits the unique index.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw alreadyRegistered;
      throw error;
    }

    // Best-effort: the account already exists at this point, so a failure to
    // deliver the verification email must not fail the request. Previously any
    // email error (unverified sending domain, provider outage, a `to` address
    // the provider rejects) threw a 500 *after* the user row was committed —
    // the caller saw signup fail, retried, and hit "email already exists",
    // leaving them permanently unable to sign up. The user can always request
    // a new code via /v1/auth/verify-email/resend.
    try {
      await this.otpService.issue(user.id, user.email, OtpPurpose.EMAIL_VERIFICATION);
    } catch (err) {
      this.logger.error(
        `Registered ${user.id} but could not send the verification email — they can request a new code. Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const session = await this.issueSession(user.id, user.email, user.role, meta);
    return { ...session, user };
  }

  async login(input: LoginInput, meta: RequestMeta) {
    await this.captchaService.verify(input.captchaToken, meta.ipAddress);

    const user = await this.usersService.findByEmail(input.email);
    // The password check runs even when there is no such account (against a
    // throwaway hash). Skipping it answered an unknown address many times
    // faster than a known one, which told a caller which emails are registered.
    const passwordMatches = await argon2.verify(user?.passwordHash ?? (await this.getDecoyPasswordHash()), input.password);
    if (!user?.passwordHash || user.deletedAt || !passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.twoFactorEnabled) {
      return { mfaRequired: true as const, challengeToken: this.signMfaChallenge(user.id, meta.rememberMe ?? false) };
    }

    const session = await this.issueSession(user.id, user.email, user.role, meta);
    await this.recordLogin(user, meta);
    return { mfaRequired: false as const, ...session, user };
  }

  async completeMfaChallenge(challengeToken: string, code: string, meta: RequestMeta) {
    const challenge = this.verifyMfaChallengeToken(challengeToken);
    const isValid = await this.mfaService.verifyChallenge(challenge.userId, code);
    if (!isValid) throw new UnauthorizedException("Invalid or expired code");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: challenge.userId } });
    if (user.deletedAt) throw new UnauthorizedException("Invalid or expired code");
    // "Remember me" was ticked on the first step; it used to be forgotten by the second.
    const session = await this.issueSession(user.id, user.email, user.role, { ...meta, rememberMe: challenge.rememberMe });
    await this.recordLogin(user, meta);
    return { ...session, user };
  }

  /**
   * Signs someone in from Google, GitHub or LinkedIn: by the provider account
   * they used before, else by the email address the provider has verified,
   * else as a new account. New accounts start as FOUNDER, the most common
   * sign-up, and pick their real account type on the next screen.
   *
   * `profile.email` is always a provider-verified address (see
   * pickVerifiedEmail). That matters here more than anywhere: this method
   * signs the caller into whichever account has that address.
   */
  async findOrCreateOAuthUser(profile: OAuthProfile, meta: RequestMeta) {
    if (!profile.email) {
      throw new OAuthSignInException("oauth_email", `${profile.provider} did not share a verified email address`);
    }

    const existingByOAuth = await this.usersService.findByOAuthAccount(profile.provider, profile.providerAccountId);
    if (existingByOAuth) return this.finishOAuthSignIn(existingByOAuth, meta);

    const existingByEmail = await this.usersService.findByEmail(profile.email);
    if (existingByEmail) {
      this.assertOAuthAllowed(existingByEmail);
      return this.finishOAuthSignIn(await this.linkOAuthAccount(existingByEmail, profile), meta);
    }

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName?.trim().slice(0, 120) || profile.email.split("@")[0]!,
          avatarUrl: profile.avatarUrl?.startsWith("https://") ? profile.avatarUrl : undefined,
          role: UserRole.FOUNDER,
          emailVerifiedAt: new Date(), // the OAuth provider already verified this address
          profile: { create: {} },
          oauthAccounts: { create: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
        },
      });
    } catch (error) {
      // Two callbacks for the same new person at once: the second finds the account the first just made.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const created = await this.usersService.findByOAuthAccount(profile.provider, profile.providerAccountId);
      if (!created) throw error;
      user = created;
    }

    return this.finishOAuthSignIn(user, meta);
  }

  private assertOAuthAllowed(user: User): void {
    if (user.deletedAt) throw new OAuthSignInException("oauth_closed", "This account is no longer available");
    // Demo accounts are shared and sign in with the demo password only.
    if (user.isDemo) throw new OAuthSignInException("oauth_failed", "This account can't be signed in to this way");
  }

  /**
   * Attaches a provider account to an existing VittamHub account with the
   * same, provider-verified, email address.
   *
   * If that account never confirmed its email, nothing shows the person who
   * created it owns the address: anyone can sign up with someone else's email
   * and wait for the real owner to arrive through Google. So in that case the
   * real owner takes the account over cleanly. The password set by whoever
   * created it is removed, every session they hold is ended, and any
   * two-factor setup of theirs is cleared. An account that had confirmed its
   * email keeps all of those.
   */
  private async linkOAuthAccount(user: User, profile: OAuthProfile): Promise<User> {
    const link = { userId: user.id, provider: profile.provider, providerAccountId: profile.providerAccountId };

    if (user.emailVerifiedAt) {
      await this.prisma.oAuthAccount.create({ data: link });
      return user;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.oAuthAccount.create({ data: link });
      await revokeUserSessions(tx, user.id);
      await tx.passwordResetToken.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
      return tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), passwordHash: null, twoFactorEnabled: false, twoFactorSecret: null },
      });
    });
  }

  /** A provider sign-in is the first factor only: an account with two-factor on still has to pass it. */
  private async finishOAuthSignIn(user: User, meta: RequestMeta) {
    this.assertOAuthAllowed(user);
    if (user.twoFactorEnabled) {
      return { mfaRequired: true as const, challengeToken: this.signMfaChallenge(user.id, false) };
    }
    const session = await this.issueSession(user.id, user.email, user.role, meta);
    await this.recordLogin(user, meta);
    return { mfaRequired: false as const, ...session };
  }

  /**
   * Exchanges a refresh token for a new session. Each token works once: it is
   * retired as its successor is issued, so a copied token is only useful until
   * the real browser next renews.
   *
   * Returns `refreshToken: undefined` in one case, the short grace period
   * described at REFRESH_REUSE_GRACE_MS: the caller then gets a fresh access
   * token only and keeps whatever refresh cookie the winning request set.
   */
  async refresh(rawRefreshToken: string | undefined, meta: RequestMeta) {
    if (!rawRefreshToken) throw new UnauthorizedException("No refresh token provided");
    const expired = () => new UnauthorizedException("Session expired — please log in again");

    const tokenHash = this.hashToken(rawRefreshToken);
    let stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date() || stored.user.deletedAt) throw expired();

    const { user } = stored;

    if (!stored.revokedAt) {
      const now = new Date();
      const familyId = stored.familyId ?? randomUUID();
      // Retire it in one conditional statement, so of two requests arriving together only one can be the one that rotates it.
      const retired = await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now, rotatedAt: now, familyId },
      });
      if (retired.count === 1) {
        return this.issueSession(user.id, user.email, user.role, { ...meta, rememberMe: stored.rememberMe }, familyId);
      }
      // Another request got there first; look at what it did.
      stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
      if (!stored) throw expired();
    }

    // From here on the token had already been used or revoked when it arrived.
    // Signed out, password changed, session revoked: never renewable again.
    if (!stored.rotatedAt || !stored.familyId) throw expired();

    const familyStillSignedIn = await this.prisma.refreshToken.count({
      where: { familyId: stored.familyId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (familyStillSignedIn === 0) throw expired();

    if (Date.now() - stored.rotatedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
      // An exchanged token turning up again later means two parties hold this
      // session. There is no telling which is the thief, so end it for both;
      // the real owner signs in again and the copy is worthless.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Refresh token reuse detected for user ${user.id}; that sign-in was ended.`);
      throw expired();
    }

    return { accessToken: this.signAccessToken(user.id, user.email, user.role), refreshToken: undefined, rememberMe: stored.rememberMe };
  }

  /**
   * Signs out the browser holding this refresh token (and anything else descended from the same sign-in).
   * Other devices stay logged in. Use SessionService.revokeAllOtherSessions for "log out everywhere".
   */
  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hashToken(rawRefreshToken) } });
    if (!token) return;
    await this.prisma.refreshToken.updateMany({
      where: { ...(token.familyId ? { familyId: token.familyId } : { id: token.id }), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private signAccessToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: this.configService.get("JWT_ACCESS_TTL", "15m"),
      },
    );
  }

  /** `familyId` ties a renewed session to the sign-in it came from; a fresh sign-in starts a new one. */
  private async issueSession(userId: string, email: string, role: string, meta: RequestMeta, familyId: string = randomUUID()) {
    const accessToken = this.signAccessToken(userId, email, role);

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
        userAgent: meta.userAgent?.slice(0, 512),
        ipAddress: meta.ipAddress,
        rememberMe,
        familyId,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken as string | undefined, rememberMe };
  }

  /**
   * Deliberately NOT the access-token secret. The MFA challenge token is
   * handed to a caller who has proven only the first factor, so it must not
   * be verifiable as a session token — otherwise it can simply be replayed
   * as the session cookie and the second factor is skipped entirely.
   * JWT_REFRESH_SECRET is already required (>=32 chars, distinct from the
   * access secret) by env.validation.ts and was otherwise unused.
   */
  private mfaChallengeSecret(): string {
    return this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  private signMfaChallenge(userId: string, rememberMe: boolean): string {
    return this.jwtService.sign(
      { sub: userId, purpose: MFA_CHALLENGE_PURPOSE, rememberMe },
      { secret: this.mfaChallengeSecret(), expiresIn: MFA_CHALLENGE_TTL },
    );
  }

  private verifyMfaChallengeToken(token: string): { userId: string; rememberMe: boolean } {
    try {
      const payload = this.jwtService.verify<{ sub: string; purpose: string; rememberMe?: boolean }>(token, {
        secret: this.mfaChallengeSecret(),
      });
      if (payload.purpose !== MFA_CHALLENGE_PURPOSE) throw new Error("wrong token purpose");
      return { userId: payload.sub, rememberMe: payload.rememberMe === true };
    } catch {
      throw new UnauthorizedException("This verification step has expired — please log in again");
    }
  }

  /** One real argon2 hash of a random value nobody knows, made the first time it's needed. */
  private getDecoyPasswordHash(): Promise<string> {
    this.decoyPasswordHash ??= argon2.hash(randomBytes(24).toString("hex"));
    return this.decoyPasswordHash;
  }

  private hashToken(rawToken: string) {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Audit trail write is awaited (cheap, local); the login-alert email is
   * queued (BullMQ, see modules/jobs) rather than sent inline, so a slow or
   * down email provider never delays the login response — and unlike a bare
   * fire-and-forget promise, a failed send gets retried instead of silently
   * dropped. Queueing itself is best-effort: if Redis is unavailable, login
   * must still succeed — a missed login-alert email is a degraded feature,
   * not a reason to lock a user out of their own account.
   *
   * The email goes out only for a sign-in from somewhere new: a browser and
   * network this account hasn't signed in from before. Sending one on every
   * login trained people to ignore it, and spent the mail provider's daily
   * allowance that verification codes and password resets also depend on.
   *
   * Call it after `issueSession`, which is what records this sign-in.
   */
  private async recordLogin(user: Pick<User, "id" | "email" | "isDemo">, meta: RequestMeta): Promise<void> {
    const { id: userId, email } = user;
    await this.prisma.auditLog.create({
      data: { actorId: userId, action: "auth.login", entityType: "User", entityId: userId, ipAddress: meta.ipAddress },
    });

    // A demo account is shared by every visitor and its address has no inbox:
    // each alert would bounce, which counts against the sending domain.
    if (user.isDemo) return;

    const deviceLabel = this.sessionService.parseDeviceLabel(meta.userAgent);
    // Counts the session just issued, so "seen before" means more than one.
    const sessionsFromHere = await this.prisma.refreshToken.count({
      where: { userId, deviceLabel, ipAddress: meta.ipAddress ?? null },
    });
    if (sessionsFromHere > 1) return;

    try {
      await this.emailQueueService.enqueueLoginAlert({
        email,
        deviceLabel,
        ipAddress: meta.ipAddress ?? "unknown",
        timestamp: new Date().toUTCString(),
      });
    } catch (err) {
      this.logger.warn(
        `Could not queue login-alert email for user ${userId} — Redis appears to be unavailable or over quota. Login succeeded regardless. Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
