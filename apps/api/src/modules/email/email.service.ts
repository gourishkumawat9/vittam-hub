import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Thin Resend wrapper. If RESEND_API_KEY isn't configured (local dev without
 * an account), emails are logged instead of sent — every auth flow that
 * "sends an email" (OTP, password reset, login alerts) stays fully testable
 * without a real provider, matching the pattern used for Stripe/R2 elsewhere.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.get<string>("EMAIL_FROM", "VittamHub <no-reply@vittamhub.com>");
  }

  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not configured — logging email instead of sending. To: ${to}, Subject: ${subject}`);
      this.logger.debug(html);
      return;
    }

    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  async sendOtpCode(to: string, code: string, purpose: "verify your email" | "sign in"): Promise<void> {
    await this.send({
      to,
      subject: `Your VittamHub verification code: ${code}`,
      html: otpEmailTemplate(code, purpose),
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Reset your VittamHub password",
      html: passwordResetEmailTemplate(resetUrl),
    });
  }

  async sendLoginAlert(to: string, deviceLabel: string, ipAddress: string, timestamp: string): Promise<void> {
    await this.send({
      to,
      subject: "New sign-in to your VittamHub account",
      html: loginAlertEmailTemplate(deviceLabel, ipAddress, timestamp),
    });
  }
}

function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111827;">
      <p style="font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #5F89C8; margin: 0 0 24px;">VittamHub</p>
      ${bodyHtml}
      <p style="font-size: 12px; color: #6B7280; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

function otpEmailTemplate(code: string, purpose: string): string {
  return emailShell(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Your verification code</h1>
    <p style="font-size: 14px; color: #374151; margin: 0 0 20px;">Use this code to ${purpose}. It expires in 10 minutes.</p>
    <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em; background: #F8FAFC; border-radius: 12px; padding: 16px 24px; text-align: center;">${code}</p>
  `);
}

function passwordResetEmailTemplate(resetUrl: string): string {
  return emailShell(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Reset your password</h1>
    <p style="font-size: 14px; color: #374151; margin: 0 0 20px;">Click the button below to choose a new password. This link expires in 30 minutes.</p>
    <a href="${resetUrl}" style="display: inline-block; background: #5F89C8; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 12px;">Reset password</a>
  `);
}

function loginAlertEmailTemplate(deviceLabel: string, ipAddress: string, timestamp: string): string {
  return emailShell(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">New sign-in detected</h1>
    <p style="font-size: 14px; color: #374151; margin: 0 0 4px;"><strong>Device:</strong> ${deviceLabel}</p>
    <p style="font-size: 14px; color: #374151; margin: 0 0 4px;"><strong>IP address:</strong> ${ipAddress}</p>
    <p style="font-size: 14px; color: #374151; margin: 0 0 20px;"><strong>Time:</strong> ${timestamp}</p>
    <p style="font-size: 14px; color: #374151;">If this wasn't you, reset your password immediately and review your active sessions.</p>
  `);
}
