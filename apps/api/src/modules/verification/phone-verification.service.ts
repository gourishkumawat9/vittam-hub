import { createHash, randomInt } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";

import { TooManyRequestsException } from "../../common/exceptions/too-many-requests.exception";
import { PrismaService } from "../../database/prisma/prisma.service";

import { SmsService } from "./sms.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes — same TTL as email OTP (OtpService)
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const PHONE_VERIFICATION_TTL_DAYS = 365; // "verification always expires" — re-confirm yearly
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CODES_PER_DAY = 5;

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

    const now = Date.now();
    const sentToday = await this.prisma.otpCode.findMany({
      where: { userId, purpose: "PHONE_VERIFICATION", createdAt: { gt: new Date(now - DAY_MS) } },
      select: { createdAt: true },
    });
    if (sentToday.some((code) => code.createdAt.getTime() > now - RESEND_COOLDOWN_MS)) {
      throw new TooManyRequestsException("Please wait a moment before requesting another code");
    }
    // Every text message costs money once a provider is connected, and a
    // number someone doesn't own shouldn't be sent a stream of them.
    if (sentToday.length >= MAX_CODES_PER_DAY) {
      throw new TooManyRequestsException("You've asked for several codes already. Please try again tomorrow.");
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

    // Count the guess first, in one conditional statement, then compare (see OtpService.verify).
    const counted = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null, attempts: { lt: MAX_VERIFY_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (counted.count === 0) {
      throw new TooManyRequestsException("Too many incorrect attempts — request a new code");
    }

    if (otp.codeHash !== this.hash(code)) return { verified: false };

    const now = new Date();
    const verified = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: now } });
      if (consumed.count !== 1) return false;

      await tx.user.update({ where: { id: userId }, data: { phoneVerifiedAt: now } });
      await tx.verificationRecord.create({
        data: {
          entityType: "User",
          entityId: userId,
          field: "phone",
          tier: "V2",
          method: "OTP_PHONE",
          status: "VERIFIED",
          verifiedAt: now,
          expiresAt: new Date(now.getTime() + PHONE_VERIFICATION_TTL_DAYS * DAY_MS),
          verifiedBy: "system:phone-verification",
        },
      });
      return true;
    });

    return { verified };
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
