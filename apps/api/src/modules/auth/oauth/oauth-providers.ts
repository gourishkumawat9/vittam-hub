import type { ConfigService } from "@nestjs/config";

export const OAUTH_PROVIDERS = ["google", "linkedin", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const ENV_PREFIX: Record<OAuthProvider, string> = {
  google: "GOOGLE",
  linkedin: "LINKEDIN",
  github: "GITHUB",
};

/** A provider can sign anyone in only when both halves of its credentials are set. */
export function isOAuthProviderConfigured(config: ConfigService, provider: OAuthProvider): boolean {
  const prefix = ENV_PREFIX[provider];
  return Boolean(config.get<string>(`${prefix}_CLIENT_ID`) && config.get<string>(`${prefix}_CLIENT_SECRET`));
}

/** What the sign-in pages may offer: only the providers this deployment can actually complete a sign-in with. */
export function configuredOAuthProviders(config: ConfigService): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((provider) => isOAuthProviderConfigured(config, provider));
}

/** The profile every strategy hands to AuthService, whatever the provider calls its fields. */
export interface OAuthProfile {
  /** Only ever an address the provider itself says it has verified; undefined otherwise. */
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  provider: OAuthProvider;
  providerAccountId: string;
}

interface ProviderEmail {
  value?: string;
  email?: string;
  verified?: unknown;
  primary?: unknown;
}

/**
 * Picks the address to trust from a provider's list: verified ones only, the
 * primary first. An unverified address proves nothing about who is signing in.
 * Anyone can type somebody else's email into a provider account, and matching
 * on it would hand them that person's VittamHub account.
 */
export function pickVerifiedEmail(emails: readonly ProviderEmail[] | undefined): string | undefined {
  const verified = (emails ?? []).filter((entry) => entry.verified === true || entry.verified === "true");
  const chosen = verified.find((entry) => entry.primary === true) ?? verified[0];
  const address = chosen?.value ?? chosen?.email;
  return typeof address === "string" && address.includes("@") ? address.trim().toLowerCase() : undefined;
}
