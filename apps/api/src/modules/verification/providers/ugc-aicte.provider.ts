import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * UGC / AICTE institutional approval & recognition lists (Section 7 —
 * university verification). PENDING until UGC_AICTE_API_KEY is configured.
 * See mca.provider.ts for the shared placeholder rationale.
 */
@Injectable()
export class UgcAicteVerificationProvider implements VerificationProvider {
  readonly method = "UGC_AICTE_API";
  private readonly logger = new Logger(UgcAicteVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("UGC_AICTE_API_KEY");
    if (!apiKey) {
      this.logger.warn("UGC_AICTE_API_KEY not configured — UGC/AICTE verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real UGC/AICTE institutional-recognition list lookup here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
