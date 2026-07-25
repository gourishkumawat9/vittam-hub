import { createHash, randomInt } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";

import { TooManyRequestsException } from "../../common/exceptions/too-many-requests.exception";
import { PrismaService } from "../../database/prisma/prisma.service";

import { SmsService } from "./sms.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes — same TTL as email OTP (OtpService)
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const PHONE_VERIFICATION_TTL_DAYS = 365; // "verification always expires" — re-confirm yearly

/**
 * The one automatable-today V2 signal spec §1 calls out by name ("phone
 * [R][V2-OTP]") — a real OTP round-trip, not a typed number. On success,
 * sets User.phoneVerifiedAt (read by TrustEngineService.phoneVerified) and
 * writes a VerificationRecord for the audit ledger.
 */
@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  async request(userId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile?.mobileNumber) {
      throw new BadRequestException("Add a phone number to your profile before verifying it");
    }

    const recent = await this.prisma.otpCode.findFirst({
      where: { userId, purpose: "PHONE_VERIFICATION", createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      throw new TooManyRequestsException("Please wait a moment before requesting another code");
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.prisma.otpCode.create({
      data: {
        userId,
        purpose: "PHONE_VERIFICATION",
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.sms.sendOtpCode(profile.mobileNumber, code);
  }

  async confirm(userId: string, code: string): Promise<{ verified: boolean }> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose: "PHONE_VERIFICATION", consumedAt: null },
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
      return { verified: false };
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: now } }),
      this.prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: now } }),
      this.prisma.verificationRecord.create({
        data: {
          entityType: "User",
          entityId: userId,
          field: "phone",
          tier: "V2",
          method: "OTP_PHONE",
          status: "VERIFIED",
          verifiedAt: now,
          expiresAt: new Date(now.getTime() + PHONE_VERIFICATION_TTL_DAYS * 24 * 60 * 60 * 1000),
          verifiedBy: "system:phone-verification",
        },
      }),
    ]);

    return { verified: true };
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
