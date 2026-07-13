import { createHash } from "node:crypto";

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  changePasswordInputSchema,
  confirmPasswordResetInputSchema,
  loginInputSchema,
  mfaChallengeInputSchema,
  mfaVerifyInputSchema,
  registerInputSchema,
  requestPasswordResetInputSchema,
  verifyOtpInputSchema,
  OtpPurpose,
  type ChangePasswordInput,
  type ConfirmPasswordResetInput,
  type LoginInput,
  type MfaChallengeInput,
  type MfaVerifyInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type VerifyOtpInput,
} from "@vittamhub/types";
import { CookieOptions, Request, Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { UsersService } from "../users/users.service";

import { AuthService, type RequestMeta } from "./auth.service";
import { MfaService } from "./services/mfa.service";
import { OtpService } from "./services/otp.service";
import { PasswordResetService } from "./services/password-reset.service";
import { SessionService } from "./services/session.service";

const REFRESH_COOKIE_NAME = "vh_refresh";

@ApiTags("auth")
@Controller("v1/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly mfaService: MfaService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionService: SessionService,
  ) {}

  // ─── Registration & login ────────────────────────────────────────────

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(registerInputSchema))
  @ApiOperation({ summary: "Create an account (any self-registerable role)" })
  async register(@Body() input: RegisterInput, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.register(input, this.requestMeta(req));
    this.setSessionCookies(res, accessToken, refreshToken, false);
    return { user, requiresEmailVerification: true };
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(loginInputSchema))
  @ApiOperation({ summary: "Log in with email and password" })
  async login(@Body() input: LoginInput, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(input, this.requestMeta(req, input.rememberMe));

    if (result.mfaRequired) {
      return { mfaRequired: true, challengeToken: result.challengeToken };
    }

    this.setSessionCookies(res, result.accessToken, result.refreshToken, input.rememberMe);
    return { mfaRequired: false, user: result.user };
  }

  @Public()
  @Post("mfa/challenge")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(mfaChallengeInputSchema))
  @ApiOperation({ summary: "Complete login by verifying a TOTP or recovery code" })
  async completeMfaChallenge(
    @Body() input: MfaChallengeInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.completeMfaChallenge(
      input.challengeToken,
      input.code,
      this.requestMeta(req),
    );
    this.setSessionCookies(res, accessToken, refreshToken, false);
    return { user };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate the session using the refresh cookie" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const { accessToken, refreshToken, rememberMe } = await this.authService.refresh(
      rawRefreshToken,
      this.requestMeta(req),
    );
    this.setSessionCookies(res, accessToken, refreshToken, rememberMe);
    return { refreshed: true };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke the current session" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
    res.clearCookie(this.configService.get("SESSION_COOKIE_NAME", "vh_session"));
    res.clearCookie(REFRESH_COOKIE_NAME);
    return { loggedOut: true };
  }

  @Get("me")
  @ApiOperation({ summary: "Return the currently authenticated user" })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.sub);
  }

  // ─── Email verification (OTP) ────────────────────────────────────────

  @Post("verify-email/resend")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: "Resend the email verification code" })
  async resendVerificationEmail(@CurrentUser() user: AuthenticatedUser) {
    await this.otpService.issue(user.sub, user.email, OtpPurpose.EMAIL_VERIFICATION);
    return { sent: true };
  }

  @Post("verify-email/confirm")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyOtpInputSchema.pick({ code: true })))
  @ApiOperation({ summary: "Confirm the 6-digit email verification code" })
  async confirmVerificationEmail(@CurrentUser() user: AuthenticatedUser, @Body() body: Pick<VerifyOtpInput, "code">) {
    const isValid = await this.otpService.verify(user.sub, OtpPurpose.EMAIL_VERIFICATION, body.code);
    if (isValid) await this.usersService.markEmailVerified(user.sub);
    return { verified: isValid };
  }

  // ─── Password reset & change ──────────────────────────────────────────

  @Public()
  @Post("password/forgot")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(requestPasswordResetInputSchema))
  @ApiOperation({ summary: "Request a password reset email" })
  async forgotPassword(@Body() input: RequestPasswordResetInput) {
    await this.passwordResetService.requestReset(input.email);
    return { sent: true }; // always true — never reveals whether the email exists
  }

  @Public()
  @Post("password/reset")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(confirmPasswordResetInputSchema))
  @ApiOperation({ summary: "Set a new password using a reset token" })
  async resetPassword(@Body() input: ConfirmPasswordResetInput) {
    await this.passwordResetService.confirmReset(input.token, input.password);
    return { reset: true };
  }

  @Post("password/change")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(changePasswordInputSchema))
  @ApiOperation({ summary: "Change password while logged in" })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() input: ChangePasswordInput) {
    await this.passwordResetService.changePassword(user.sub, input.currentPassword, input.newPassword);
    return { changed: true };
  }

  // ─── MFA enrollment ────────────────────────────────────────────────────

  @Post("mfa/enroll")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Begin TOTP enrollment — returns a QR code to scan" })
  async beginMfaEnrollment(@CurrentUser() user: AuthenticatedUser) {
    return this.mfaService.beginEnrollment(user.sub, user.email);
  }

  @Post("mfa/enroll/confirm")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(mfaVerifyInputSchema))
  @ApiOperation({ summary: "Confirm TOTP enrollment with a code from the authenticator app" })
  async confirmMfaEnrollment(@CurrentUser() user: AuthenticatedUser, @Body() input: MfaVerifyInput) {
    const recoveryCodes = await this.mfaService.confirmEnrollment(user.sub, input.code);
    return { enabled: true, recoveryCodes };
  }

  @Post("mfa/disable")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(mfaVerifyInputSchema))
  @ApiOperation({ summary: "Disable MFA (requires a valid code)" })
  async disableMfa(@CurrentUser() user: AuthenticatedUser, @Body() input: MfaVerifyInput) {
    await this.mfaService.disable(user.sub, input.code);
    return { disabled: true };
  }

  // ─── Sessions ──────────────────────────────────────────────────────────

  @Get("sessions")
  @ApiOperation({ summary: "List active sessions/devices" })
  async listSessions(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    const currentTokenHash = this.hashCookie(req.cookies?.[REFRESH_COOKIE_NAME]);
    return this.sessionService.listActiveSessions(user.sub, currentTokenHash);
  }

  @Delete("sessions/:id")
  @ApiOperation({ summary: "Revoke a specific session" })
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param("id") sessionId: string) {
    await this.sessionService.revokeSession(user.sub, sessionId);
    return { revoked: true };
  }

  @Delete("sessions")
  @ApiOperation({ summary: "Log out of every other device" })
  async revokeOtherSessions(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    const currentTokenHash = this.hashCookie(req.cookies?.[REFRESH_COOKIE_NAME]);
    await this.sessionService.revokeAllOtherSessions(user.sub, currentTokenHash);
    return { revoked: true };
  }

  // ─── CAPTCHA site key (public config, not a secret) ───────────────────

  @Public()
  @Get("captcha-site-key")
  @ApiExcludeEndpoint()
  captchaSiteKey() {
    return { siteKey: this.configService.get("CAPTCHA_SITE_KEY") ?? null };
  }

  // ─── OAuth ─────────────────────────────────────────────────────────────

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiExcludeEndpoint()
  googleAuth() {
    // Passport redirects to Google before this body ever runs.
  }

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Public()
  @Get("github")
  @UseGuards(AuthGuard("github"))
  @ApiExcludeEndpoint()
  githubAuth() {}

  @Public()
  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  @ApiExcludeEndpoint()
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Public()
  @Get("linkedin")
  @UseGuards(AuthGuard("linkedin"))
  @ApiExcludeEndpoint()
  linkedinAuth() {}

  @Public()
  @Get("linkedin/callback")
  @UseGuards(AuthGuard("linkedin"))
  @ApiExcludeEndpoint()
  async linkedinCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private async handleOAuthCallback(req: Request, res: Response) {
    const profile = req.user as {
      email?: string;
      fullName?: string;
      avatarUrl?: string;
      provider: string;
      providerAccountId: string;
    };

    const { accessToken, refreshToken } = await this.authService.findOrCreateOAuthUser(profile, this.requestMeta(req));
    this.setSessionCookies(res, accessToken, refreshToken, false);
    res.redirect(`${this.configService.get("APP_URL")}/founder`);
  }

  private requestMeta(req: Request, rememberMe = false): RequestMeta {
    return {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      rememberMe,
    };
  }

  private hashCookie(rawToken: string | undefined): string {
    if (!rawToken) return "";
    return createHash("sha256").update(rawToken).digest("hex");
  }

  private setSessionCookies(res: Response, accessToken: string, refreshToken: string, rememberMe: boolean) {
    const isProd = this.configService.get("NODE_ENV") === "production";
    const baseOptions: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    };

    res.cookie(this.configService.get("SESSION_COOKIE_NAME", "vh_session"), accessToken, {
      ...baseOptions,
      maxAge: 1000 * 60 * 15, // 15m, mirrors JWT_ACCESS_TTL
    });
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...baseOptions,
      maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24,
    });
  }
}
