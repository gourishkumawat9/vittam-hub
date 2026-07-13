import { createHash, randomBytes } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

import { PrismaService } from "../../../database/prisma/prisma.service";
import { EmailService } from "../../email/email.service";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /** Always succeeds from the caller's perspective even if the email doesn't exist — prevents account enumeration. */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = randomBytes(32).toString("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(rawToken),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const resetUrl = `${this.configService.get("APP_URL")}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordReset(email, resetUrl);
  }

  async confirmReset(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hash(rawToken);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.consumedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { consumedAt: new Date() } }),
      // Resetting a password invalidates every existing session — the whole point is recovering from a compromised account.
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
