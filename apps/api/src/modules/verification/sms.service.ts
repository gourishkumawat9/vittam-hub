import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Thin SMS wrapper, same shape as EmailService: if SMS_API_KEY isn't
 * configured (local dev, or before a real provider — Twilio/MSG91/etc. — is
 * chosen), the code is logged instead of sent so PhoneVerificationService
 * stays fully testable without a real account. Matches STATUS.md's existing
 * "verification codes log to console" behavior for email.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtpCode(toPhone: string, code: string): Promise<void> {
    const apiKey = this.configService.get<string>("SMS_API_KEY");
    if (!apiKey) {
      this.logger.warn(`SMS_API_KEY not configured — logging SMS instead of sending. To: ${toPhone}, Code: ${code}`);
      return;
    }
    // TODO: wire a real SMS provider (Twilio/MSG91/etc.) here once one is chosen.
    this.logger.warn(`SMS_API_KEY configured but no provider integration implemented yet. To: ${toPhone}`);
  }
}
