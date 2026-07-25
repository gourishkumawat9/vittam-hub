import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * GSTN (Goods & Services Tax Network) registry — verifies GSTIN validity and
 * filing regularity (Bundle 4/18). PENDING until GSTIN_API_KEY is configured.
 * See mca.provider.ts for the shared placeholder rationale.
 */
@Injectable()
export class GstinVerificationProvider implements VerificationProvider {
  readonly method = "GSTIN_API";
  private readonly logger = new Logger(GstinVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("GSTIN_API_KEY");
    if (!apiKey) {
      this.logger.warn("GSTIN_API_KEY not configured — GSTIN verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real GSTN public search/verify API here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
