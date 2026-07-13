import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CaptchaService } from "./services/captcha.service";
import { MfaService } from "./services/mfa.service";
import { OtpService } from "./services/otp.service";
import { PasswordResetService } from "./services/password-reset.service";
import { SessionService } from "./services/session.service";
import { GithubStrategy } from "./strategies/github.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LinkedinStrategy } from "./strategies/linkedin.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    LinkedinStrategy,
    CaptchaService,
    OtpService,
    MfaService,
    PasswordResetService,
    SessionService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
