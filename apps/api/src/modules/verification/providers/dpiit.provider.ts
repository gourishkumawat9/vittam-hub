import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * Startup India / DPIIT recognition registry — verifies DPIIT recognition
 * number and 80-IAC/angel-tax exemption status (Bundle 4). PENDING until
 * DPIIT_API_KEY is configured. See mca.provider.ts for the shared rationale.
 */
@Injectable()
export class DpiitVerificationProvider implements VerificationProvider {
  readonly method = "DPIIT_API";
  private readonly logger = new Logger(DpiitVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("DPIIT_API_KEY");
    if (!apiKey) {
      this.logger.warn("DPIIT_API_KEY not configured — DPIIT verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real Startup India / DPIIT recognition lookup (or DigiLocker QR verification) here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
