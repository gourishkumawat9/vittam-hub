import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-linkedin-oauth2";

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, "linkedin") {
  constructor(configService: ConfigService) {
    // See google.strategy.ts — passport-oauth2 requires a non-empty clientID at construction.
    super({
      clientID: configService.get<string>("LINKEDIN_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("LINKEDIN_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/linkedin/callback`,
      scope: ["r_emailaddress", "r_liteprofile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { emails, displayName, photos } = profile;
    done(null, {
      email: emails?.[0]?.value,
      fullName: displayName,
      avatarUrl: photos?.[0]?.value,
      provider: "linkedin",
      providerAccountId: profile.id,
    });
  }
}
