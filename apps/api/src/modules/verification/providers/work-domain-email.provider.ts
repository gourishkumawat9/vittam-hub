import { Injectable } from "@nestjs/common";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

// Common free/consumer webmail domains — anything else is treated as a work domain.
// A real domain-ownership/MX check is future work; this heuristic is still a
// genuine, cheap, automatable-today V2 signal per spec §4 ("work-domain email,
// not gmail"), not a fabricated one.
export const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.in",
  "yahoo.co.in",
  "yahoo.co.uk",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "outlook.in",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "live.in",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "aol.com",
  "rediffmail.com",
  "zoho.com",
  "zohomail.in",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "tutanota.com",
  "tuta.io",
  "duck.com",
  "fastmail.com",
  "hey.com",
]);

/**
 * The one provider in this directory that runs for real today (no external
 * API, no config gate) — everything else here is a PENDING placeholder until
 * a registry key is configured.
 */
@Injectable()
export class WorkDomainEmailVerificationProvider implements VerificationProvider {
  readonly method = "DOMAIN_EMAIL_HEURISTIC";

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const email = input.email?.toLowerCase().trim();
    const domain = email?.split("@")[1];
    if (!domain) {
      return { status: "FAILED", tier: "V2", rawResponse: { reason: "no email provided" } };
    }
    const isWorkDomain = !FREE_EMAIL_DOMAINS.has(domain);
    return {
      status: isWorkDomain ? "VERIFIED" : "FAILED",
      tier: "V2",
      rawResponse: { domain, isWorkDomain },
      expiresAt: isWorkDomain ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined,
    };
  }
}
