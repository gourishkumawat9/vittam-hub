import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-linkedin-oauth2";

import { pickVerifiedEmail, type OAuthProfile } from "../oauth/oauth-providers";
import { OAuthStateCookieStore } from "../oauth/oauth-state.store";

const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

/** LinkedIn's OpenID Connect profile (https://learn.microsoft.com/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2). */
interface LinkedinUserInfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean | string;
}

interface LinkedinProfile {
  id: string;
  displayName?: string;
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

type ProfileCallback = (error: unknown, profile?: LinkedinProfile) => void;

/**
 * "Sign In with LinkedIn using OpenID Connect". The library's own profile
 * call uses `r_liteprofile` / `r_emailaddress`, which LinkedIn stopped
 * granting to apps in August 2023, and never said whether an address was
 * verified. So this keeps the library for the OAuth exchange and reads the
 * profile from the OpenID Connect `userinfo` endpoint instead, which does.
 */
@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, "linkedin") {
  constructor(configService: ConfigService) {
    // See google.strategy.ts — passport-oauth2 requires a non-empty clientID at construction.
    super({
      clientID: configService.get<string>("LINKEDIN_CLIENT_ID") || "not-configured",
      clientSecret: configService.get<string>("LINKEDIN_CLIENT_SECRET") || "not-configured",
      callbackURL: `${configService.getOrThrow<string>("API_URL")}/v1/auth/linkedin/callback`,
      scope: ["openid", "profile", "email"],
      store: new OAuthStateCookieStore(configService.get("NODE_ENV") === "production"),
    });
  }

  /** Replaces the library's legacy profile request (passport-oauth2 calls this after the token exchange). */
  userProfile(accessToken: string, done: ProfileCallback): void {
    fetch(LINKEDIN_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`LinkedIn userinfo answered ${response.status}`);
        return (await response.json()) as LinkedinUserInfo;
      })
      .then((info) => {
        if (!info.sub) throw new Error("LinkedIn userinfo carried no account id");
        const fullName = info.name || [info.given_name, info.family_name].filter(Boolean).join(" ") || undefined;
        done(null, {
          id: info.sub,
          displayName: fullName,
          emails: info.email
            ? [{ value: info.email, verified: info.email_verified === true || info.email_verified === "true" }]
            : [],
          photos: info.picture ? [{ value: info.picture }] : [],
        });
      })
      .catch((error: unknown) => done(error));
  }

  validate(_accessToken: string, _refreshToken: string, profile: LinkedinProfile, done: VerifyCallback) {
    const user: OAuthProfile = {
      email: pickVerifiedEmail(profile.emails),
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      provider: "linkedin",
      providerAccountId: profile.id,
    };
    done(null, user);
  }
}
