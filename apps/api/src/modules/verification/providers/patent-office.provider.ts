import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * Indian Patent Office / IP India registry — verifies patent application &
 * grant numbers, status, and trademark filings (Bundle 17). PENDING until
 * PATENT_OFFICE_API_KEY is configured. See mca.provider.ts for the shared
 * placeholder rationale.
 */
@Injectable()
export class PatentOfficeVerificationProvider implements VerificationProvider {
  readonly method = "PATENT_OFFICE_API";
  private readonly logger = new Logger(PatentOfficeVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("PATENT_OFFICE_API_KEY");
    if (!apiKey) {
      this.logger.warn("PATENT_OFFICE_API_KEY not configured — patent/trademark verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real IP India patent/trademark search API here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
