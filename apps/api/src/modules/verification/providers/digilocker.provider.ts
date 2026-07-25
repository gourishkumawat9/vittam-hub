import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { VerificationProvider, VerificationProviderResult } from "./verification-provider.interface";

/**
 * DigiLocker — general-purpose government document verification (education
 * certificates, DPIIT QR, government ID) via consented document pull rather
 * than a single-purpose registry. PENDING until DIGILOCKER_CLIENT_ID is
 * configured (OAuth-style consent flow, not a bare API key). See
 * mca.provider.ts for the shared placeholder rationale.
 */
@Injectable()
export class DigilockerVerificationProvider implements VerificationProvider {
  readonly method = "DIGILOCKER_API";
  private readonly logger = new Logger(DigilockerVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(input: Record<string, string>): Promise<VerificationProviderResult> {
    const clientId = this.config.get<string>("DIGILOCKER_CLIENT_ID");
    if (!clientId) {
      this.logger.warn("DIGILOCKER_CLIENT_ID not configured — DigiLocker verification left PENDING");
      return { status: "PENDING", tier: "V3", rawResponse: { configured: false, input } };
    }
    // TODO: wire the real DigiLocker consent + document-pull OAuth flow here.
    return { status: "PENDING", tier: "V3", rawResponse: { configured: true, note: "integration not yet implemented", input } };
  }
}
