import { createHash, randomInt } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";
import { OtpPurpose } from "@vittamhub/types";

import { TooManyRequestsException } from "../../../common/exceptions/too-many-requests.exception";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { EmailService } from "../../email/email.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends, per purpose

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async issue(userId: string, email: string, purpose: OtpPurpose): Promise<void> {
    const recent = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      throw new TooManyRequestsException("Please wait a moment before requesting another code");
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

    await this.prisma.otpCode.create({
      data: {
        userId,
        purpose,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.emailService.sendOtpCode(email, code, purpose === "EMAIL_VERIFICATION" ? "verify your email" : "sign in");
  }

  async verify(userId: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException("Code has expired — request a new one");
    }
    if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new TooManyRequestsException("Too many incorrect attempts — request a new code");
    }

    const isValid = otp.codeHash === this.hash(code);

    if (!isValid) {
      await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return false;
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return true;
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
