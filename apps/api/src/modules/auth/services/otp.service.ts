import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";
import { OtpPurpose } from "@vittamhub/types";

import { TooManyRequestsException } from "../../../common/exceptions/too-many-requests.exception";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { EmailService } from "../../email/email.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends, per purpose
const HOUR_MS = 60 * 60 * 1000;
/**
 * Each code allows 5 guesses, so the number of codes is what bounds how many
 * guesses someone gets at an address they can't read (and how much mail an
 * address they don't own can be sent). 10 codes a day is 50 guesses in a
 * million.
 */
const MAX_CODES_PER_HOUR = 5;
const MAX_CODES_PER_DAY = 10;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async issue(userId: string, email: string, purpose: OtpPurpose): Promise<void> {
    const now = Date.now();
    const sentToday = await this.prisma.otpCode.findMany({
      where: { userId, purpose, createdAt: { gt: new Date(now - 24 * HOUR_MS) } },
      select: { createdAt: true },
    });
    const sentSince = (ms: number) => sentToday.filter((code) => code.createdAt.getTime() > now - ms).length;

    if (sentSince(RESEND_COOLDOWN_MS) > 0) {
      throw new TooManyRequestsException("Please wait a moment before requesting another code");
    }
    if (sentSince(HOUR_MS) >= MAX_CODES_PER_HOUR || sentToday.length >= MAX_CODES_PER_DAY) {
      throw new TooManyRequestsException("You've asked for several codes already. Please try again later.");
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

    // The guess is counted first, in one conditional statement, and only then
    // compared. Reading the count and adding to it afterwards let a burst of
    // simultaneous requests all read "0 attempts" and try far more than 5 codes.
    const counted = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null, attempts: { lt: MAX_VERIFY_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (counted.count === 0) {
      throw new TooManyRequestsException("Too many incorrect attempts — request a new code");
    }

    if (!this.matches(otp.codeHash, code)) return false;

    // Same idea for using it up: only one request can be the one that consumes a code.
    const consumed = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return consumed.count === 1;
  }

  private matches(codeHash: string, code: string): boolean {
    const expected = Buffer.from(codeHash, "hex");
    const given = Buffer.from(this.hash(code), "hex");
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
