import { createHash, randomBytes } from "node:crypto";

import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

import { PrismaService } from "../../../database/prisma/prisma.service";
import { EmailService } from "../../email/email.service";

import { revokeUserSessions } from "./session-revocation";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const HOUR_MS = 60 * 60 * 1000;
/** Reset emails one address can be sent. Anyone can type anyone's email into "forgot password". */
const MAX_RESET_EMAILS_PER_HOUR = 3;
const MAX_RESET_EMAILS_PER_DAY = 6;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /** Always succeeds from the caller's perspective even if the email doesn't exist — prevents account enumeration. */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Demo accounts are shared and take their password from the server's settings, never from a reset link.
    if (!user || user.deletedAt || user.isDemo) return;

    const recent = await this.prisma.passwordResetToken.findMany({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 24 * HOUR_MS) } },
      select: { createdAt: true },
    });
    const lastHour = recent.filter((token) => token.createdAt.getTime() > Date.now() - HOUR_MS).length;
    if (lastHour >= MAX_RESET_EMAILS_PER_HOUR || recent.length >= MAX_RESET_EMAILS_PER_DAY) return;

    const rawToken = randomBytes(32).toString("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(rawToken),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const resetUrl = `${this.configService.get("APP_URL")}/reset-password?token=${rawToken}`;
    // Not awaited, and never allowed to fail the request. An unknown address
    // returns at once with 200, so both a slower answer and an error status
    // for a known one would reveal that the account exists, which is exactly
    // what this method promises not to do.
    void this.emailService.sendPasswordReset(email, resetUrl).catch((err: unknown) => {
      this.logger.error(
        `Could not send the password-reset email. Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  async confirmReset(rawToken: string, newPassword: string): Promise<void> {
    const invalid = () => new BadRequestException("This reset link is invalid or has expired");
    const tokenHash = this.hash(rawToken);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!resetToken || resetToken.consumedAt || resetToken.expiresAt < new Date() || resetToken.user.deletedAt) {
      throw invalid();
    }

    const passwordHash = await argon2.hash(newPassword);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Claimed in one conditional statement, so a link opened twice at once can only set one password.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) throw invalid();

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          // The link only ever went to this address, so opening it is the same proof as the emailed code.
          emailVerifiedAt: resetToken.user.emailVerifiedAt ?? now,
        },
      });
      // Any other link still sitting in the inbox stops working too.
      await tx.passwordResetToken.updateMany({ where: { userId: resetToken.userId, consumedAt: null }, data: { consumedAt: now } });
      // Resetting a password invalidates every existing session — the whole point is recovering from a compromised account.
      await revokeUserSessions(tx, resetToken.userId);
    });
  }

  /** `currentTokenHash` is the browser making the change: it stays signed in, every other one is signed out. */
  async changePassword(userId: string, currentPassword: string, newPassword: string, currentTokenHash?: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: new Date() } });
      // People change a password because they think someone else has it. Leaving that someone signed in defeats the change.
      await revokeUserSessions(tx, userId, currentTokenHash || undefined);
    });
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
