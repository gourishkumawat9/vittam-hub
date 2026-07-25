import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * Government-recognized incubator/accelerator lists (Section 6) — Atal
 * Innovation Mission, DST-supported incubators. PENDING until
 * INCUBATOR_REGISTRY_API_KEY is configured. DPIIT-recognised-incubator status
 * is covered separately by dpiit.provider.ts (same registry, different
 * field). See mca.provider.ts for the shared placeholder rationale.
 */
@Injectable()
export class IncubatorRegistryVerificationProvider implements VerificationProvider {
  readonly method = "AIM_DST_INCUBATOR_API";
  private readonly logger = new Logger(IncubatorRegistryVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const apiKey = this.config.get<string>("INCUBATOR_REGISTRY_API_KEY");
    if (!apiKey) {
      this.logger.warn("INCUBATOR_REGISTRY_API_KEY not configured — Atal Innovation Mission/DST verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real Atal Innovation Mission / DST-supported-incubator list lookup here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
