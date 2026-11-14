import { randomBytes, createHash } from "node:crypto";

import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

import { TooManyRequestsException } from "../../../common/exceptions/too-many-requests.exception";
import { PrismaService } from "../../../database/prisma/prisma.service";

const RECOVERY_CODE_COUNT = 10;

const MFA_FAILED_ACTION = "auth.mfa_failed";
/**
 * A 6-digit code has a million possibilities and a new one every 30 seconds,
 * so what protects it is how few guesses are allowed. Counted per account, not
 * per IP address: someone holding the password can spread guesses over many
 * addresses, but they all land on the same account.
 */
const MAX_FAILED_CODES = 5;
const FAILED_CODE_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Step 1 of enrollment — generates a secret and QR code but does NOT enable MFA yet; that happens once the user proves they scanned it via `confirmEnrollment`. */
  async beginEnrollment(userId: string, email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.twoFactorEnabled) {
      throw new ConflictException("Two-factor authentication is already enabled");
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, "VittamHub", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Stored immediately (pre-confirmation) so `confirmEnrollment` can verify against it;
    // `twoFactorEnabled` stays false until the user proves possession of the device.
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  async confirmEnrollment(userId: string, code: string): Promise<string[]> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) {
      throw new BadRequestException("Start enrollment first");
    }
    if (user.twoFactorEnabled) {
      throw new ConflictException("Two-factor authentication is already enabled");
    }
    const secret = user.twoFactorSecret;
    if (!(await this.withAttemptLimit(userId, async () => authenticator.check(code, secret)))) {
      throw new BadRequestException("Invalid code — check your authenticator app and try again");
    }

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return this.generateRecoveryCodes(userId);
  }

  async disable(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException("Two-factor authentication is not enabled");
    }
    const secret = user.twoFactorSecret;
    if (!(await this.withAttemptLimit(userId, async () => authenticator.check(code, secret)))) {
      throw new UnauthorizedException("Invalid code");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /** Verifies a TOTP code OR a single-use recovery code — used at login time, not during enrollment. */
  async verifyChallenge(userId: string, code: string): Promise<boolean> {
    return this.withAttemptLimit(userId, async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.deletedAt || !user.twoFactorEnabled || !user.twoFactorSecret) return false;

      if (code.length === 6 && authenticator.check(code, user.twoFactorSecret)) {
        return true;
      }

      return this.consumeRecoveryCode(tx, userId, code);
    });
  }

  /**
   * Runs one code check for an account, unless it has had too many wrong ones
   * lately. The per-account lock makes simultaneous guesses wait for each
   * other; without it a burst of requests would all be counted as "the first".
   * A wrong guess is recorded in the audit log, which is also what is counted.
   */
  private async withAttemptLimit(
    userId: string,
    check: (tx: Prisma.TransactionClient) => Promise<boolean>,
  ): Promise<boolean> {
    const outcome = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mfa-code:${userId}`}))`;

      const recentFailures = await tx.auditLog.count({
        where: {
          actorId: userId,
          action: MFA_FAILED_ACTION,
          createdAt: { gt: new Date(Date.now() - FAILED_CODE_WINDOW_MS) },
        },
      });
      if (recentFailures >= MAX_FAILED_CODES) return "locked" as const;

      if (await check(tx)) return "ok" as const;

      await tx.auditLog.create({
        data: { actorId: userId, action: MFA_FAILED_ACTION, entityType: "User", entityId: userId },
      });
      return "wrong" as const;
    });

    if (outcome === "locked") {
      throw new TooManyRequestsException("Too many incorrect codes. Wait 15 minutes, then try again.");
    }
    return outcome === "ok";
  }

  private async consumeRecoveryCode(tx: Prisma.TransactionClient, userId: string, code: string): Promise<boolean> {
    const codeHash = this.hashRecoveryCode(code.trim().toLowerCase());
    // One conditional statement, so a recovery code can't be spent twice by two requests at once.
    const used = await tx.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return used.count === 1;
  }

  private async generateRecoveryCodes(userId: string): Promise<string[]> {
    await this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } });

    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => randomBytes(5).toString("hex"));
    await this.prisma.mfaRecoveryCode.createMany({
      data: codes.map((code) => ({ userId, codeHash: this.hashRecoveryCode(code) })),
    });

    return codes; // returned once, in plaintext — never retrievable again after this response
  }

  private hashRecoveryCode(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
