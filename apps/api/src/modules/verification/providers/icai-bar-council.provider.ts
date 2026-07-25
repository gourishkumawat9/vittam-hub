import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * Professional-body membership checks for service providers (Section 8) —
 * ICAI for CAs, Bar Council for lawyers. One provider covers both since
 * they're the same shape of "member ID -> active/registered" lookup; the
 * caller passes `body` ("ICAI" | "BAR_COUNCIL") in `input`. PENDING until
 * ICAI_BAR_API_KEY is configured. See mca.provider.ts for the shared rationale.
 */
@Injectable()
export class IcaiBarCouncilVerificationProvider implements VerificationProvider {
  readonly method = "ICAI_BAR_API";
  private readonly logger = new Logger(IcaiBarCouncilVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("ICAI_BAR_API_KEY");
    if (!apiKey) {
      this.logger.warn("ICAI_BAR_API_KEY not configured — professional-body verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real ICAI member lookup / Bar Council of India advocate lookup here, keyed off input.body.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
