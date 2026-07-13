import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile verification. A no-op when CAPTCHA_SECRET_KEY isn't
 * configured (local dev) — matches the pattern used for Stripe/R2/Resend:
 * every flow that depends on an external key works without one, just without
 * that layer of protection, rather than hard-blocking auth entirely.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    const secretKey = this.configService.get<string>("CAPTCHA_SECRET_KEY");
    if (!secretKey) {
      this.logger.warn("CAPTCHA_SECRET_KEY not configured — skipping captcha verification");
      return;
    }

    if (!token) {
      throw new BadRequestException("Captcha verification is required");
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: remoteIp }),
    });

    const result = (await response.json()) as { success: boolean };
    if (!result.success) {
      throw new BadRequestException("Captcha verification failed");
    }
  }
}
