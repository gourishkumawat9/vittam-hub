import { randomBytes, createHash } from "node:crypto";

import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

import { PrismaService } from "../../../database/prisma/prisma.service";

const RECOVERY_CODE_COUNT = 10;

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
    if (!authenticator.check(code, user.twoFactorSecret)) {
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
    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException("Invalid code");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /** Verifies a TOTP code OR a single-use recovery code — used at login time, not during enrollment. */
  async verifyChallenge(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return false;

    if (code.length === 6 && authenticator.check(code, user.twoFactorSecret)) {
      return true;
    }

    return this.consumeRecoveryCode(userId, code);
  }

  private async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const codeHash = this.hashRecoveryCode(code);
    const match = await this.prisma.mfaRecoveryCode.findFirst({ where: { userId, codeHash, usedAt: null } });
    if (!match) return false;

    await this.prisma.mfaRecoveryCode.update({ where: { id: match.id }, data: { usedAt: new Date() } });
    return true;
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
