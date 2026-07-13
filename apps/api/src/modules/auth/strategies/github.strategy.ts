import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-github2";

type VerifyCallback = (error: unknown, user?: unknown) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(configService: ConfigService) {
    // See google.strategy.ts — passport-oauth2 requires a non-empty clientID at construction.
    super({
      clientID: configService.get<string>("GITHUB_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("GITHUB_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/github/callback`,
      scope: ["user:email"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { emails, displayName, username, photos } = profile;
    done(null, {
      email: emails?.[0]?.value,
      fullName: displayName || username,
      avatarUrl: photos?.[0]?.value,
      provider: "github",
      providerAccountId: profile.id,
    });
  }
}
