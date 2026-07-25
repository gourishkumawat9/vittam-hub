import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * SEBI registration check for registered AIFs/VCs (Section 4 — investor
 * verification). PENDING until SEBI_API_KEY is configured. See
 * mca.provider.ts for the shared placeholder rationale.
 */
@Injectable()
export class SebiVerificationProvider implements VerificationProvider {
  readonly method = "SEBI_API";
  private readonly logger = new Logger(SebiVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("SEBI_API_KEY");
    if (!apiKey) {
      this.logger.warn("SEBI_API_KEY not configured — SEBI verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real SEBI intermediary/AIF registry lookup here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
