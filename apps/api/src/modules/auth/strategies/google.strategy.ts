import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { pickVerifiedEmail, type OAuthProfile } from "../oauth/oauth-providers";
import { OAuthStateCookieStore } from "../oauth/oauth-state.store";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    // passport-oauth2's base Strategy throws synchronously on an empty
    // clientID, which would crash the entire app at boot in any environment
    // that hasn't configured Google OAuth yet. A placeholder keeps
    // construction safe; OAuthGuard turns the routes away before the
    // placeholder is ever used. Same pattern in github.strategy.ts and
    // linkedin.strategy.ts.
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/google/callback`,
      scope: ["email", "profile"],
      store: new OAuthStateCookieStore(configService.get("NODE_ENV") === "production"),
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { emails, displayName, photos } = profile;
    const user: OAuthProfile = {
      // Google reports `email_verified` for every address; only a verified one identifies the person.
      email: pickVerifiedEmail(emails),
      fullName: displayName,
      avatarUrl: photos?.[0]?.value,
      provider: "google",
      providerAccountId: profile.id,
    };
    done(null, user);
  }
}
