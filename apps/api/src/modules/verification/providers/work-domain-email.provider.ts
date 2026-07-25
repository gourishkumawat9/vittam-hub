import { Injectable } from "@nestjs/common";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

// Common free/consumer webmail domains — anything else is treated as a work domain.
// A real domain-ownership/MX check is future work; this heuristic is still a
// genuine, cheap, automatable-today V2 signal per spec §4 ("work-domain email,
// not gmail"), not a fabricated one.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "aol.com",
  "live.com",
  "rediffmail.com",
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
