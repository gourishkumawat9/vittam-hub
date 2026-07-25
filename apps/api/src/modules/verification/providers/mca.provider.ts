import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * Ministry of Corporate Affairs (MCA21) company/LLP registry — verifies
 * CIN/LLPIN, legal name, incorporation date, director DIN list (Bundle 4).
 * PENDING placeholder until MCA_API_KEY is configured — no API call is made
 * and no admin queue accrues; this is the "not yet automated, sits in a
 * pending state" placeholder CLAUDE.md §6 requires, not a manual-review queue.
 * Confirm MCA's current API access method before wiring the real call — spec
 * §2 flags this info may be a few months stale.
 */
@Injectable()
export class McaVerificationProvider implements VerificationProvider {
  readonly method = "MCA_API";
  private readonly logger = new Logger(McaVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("MCA_API_KEY");
    if (!apiKey) {
      this.logger.warn("MCA_API_KEY not configured — MCA verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real MCA21 company-master lookup here once access is confirmed.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
