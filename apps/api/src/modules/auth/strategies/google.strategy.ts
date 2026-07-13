import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    // passport-oauth2's base Strategy throws synchronously on an empty
    // clientID, which would crash the entire app at boot in any environment
    // that hasn't configured Google OAuth yet — a placeholder keeps
    // construction safe; hitting /v1/auth/google unconfigured then fails
    // cleanly at Google's end instead of ours. Same pattern in
    // github.strategy.ts and linkedin.strategy.ts.
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/google/callback`,
      scope: ["email", "profile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { emails, displayName, photos } = profile;
    done(null, {
      email: emails?.[0]?.value,
      fullName: displayName,
      avatarUrl: photos?.[0]?.value,
      provider: "google",
      providerAccountId: profile.id,
    });
  }
}
