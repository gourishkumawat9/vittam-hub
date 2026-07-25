import { Injectable } from "@nestjs/common";

import { DigilockerVerificationProvider } from "./digilocker.provider";
import { DpiitVerificationProvider } from "./dpiit.provider";
import { GstinVerificationProvider } from "./gstin.provider";
import { IcaiBarCouncilVerificationProvider } from "./icai-bar-council.provider";
import { IncubatorRegistryVerificationProvider } from "./incubator-registry.provider";
import { McaVerificationProvider } from "./mca.provider";
import { PatentOfficeVerificationProvider } from "./patent-office.provider";
import { SebiVerificationProvider } from "./sebi.provider";
import { UgcAicteVerificationProvider } from "./ugc-aicte.provider";
import type { VerificationProvider } from "./verification-provider.interface";
import { WorkDomainEmailVerificationProvider } from "./work-domain-email.provider";

/** Looks up a VerificationProvider by its `method` string — the one place that knows every registered integration. */
@Injectable()
export class VerificationProviderRegistry {
  private readonly providers = new Map<string, VerificationProvider>();

  constructor(
    mca: McaVerificationProvider,
    gstin: GstinVerificationProvider,
    dpiit: DpiitVerificationProvider,
    sebi: SebiVerificationProvider,
    patentOffice: PatentOfficeVerificationProvider,
    ugcAicte: UgcAicteVerificationProvider,
    icaiBar: IcaiBarCouncilVerificationProvider,
    digilocker: DigilockerVerificationProvider,
    workDomainEmail: WorkDomainEmailVerificationProvider,
    incubatorRegistry: IncubatorRegistryVerificationProvider,
  ) {
    for (const provider of [mca, gstin, dpiit, sebi, patentOffice, ugcAicte, icaiBar, digilocker, workDomainEmail, incubatorRegistry]) {
      this.providers.set(provider.method, provider);
    }
  }

  get(method: string): VerificationProvider | undefined {
    return this.providers.get(method);
  }

  list(): string[] {
    return [...this.providers.keys()];
  }
}
