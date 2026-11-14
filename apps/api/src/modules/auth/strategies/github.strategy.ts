import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-github2";

import { pickVerifiedEmail, type OAuthProfile } from "../oauth/oauth-providers";
import { OAuthStateCookieStore } from "../oauth/oauth-state.store";

type VerifyCallback = (error: unknown, user?: unknown) => void;

/** With `allRawEmails`, each entry is GitHub's own record: the address plus whether it is primary and verified. */
type GithubEmail = { value?: string; primary?: boolean; verified?: boolean };

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(configService: ConfigService) {
    // See google.strategy.ts — passport-oauth2 requires a non-empty clientID at construction.
    super({
      clientID: configService.get<string>("GITHUB_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("GITHUB_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/github/callback`,
      scope: ["user:email"],
      // The default hands back the primary address without saying whether
      // GitHub ever verified it. Asking for the full list is the only way to
      // see the `verified` flag.
      allRawEmails: true,
      store: new OAuthStateCookieStore(configService.get("NODE_ENV") === "production"),
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { displayName, username, photos } = profile;
    const user: OAuthProfile = {
      email: pickVerifiedEmail(profile.emails as GithubEmail[] | undefined),
      fullName: displayName || username,
      avatarUrl: photos?.[0]?.value,
      provider: "github",
      providerAccountId: profile.id,
    };
    done(null, user);
  }
}
