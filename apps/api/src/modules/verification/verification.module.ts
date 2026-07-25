import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";
import { StartupsModule } from "../startups/startups.module";

import { PhoneVerificationService } from "./phone-verification.service";
import { DigilockerVerificationProvider } from "./providers/digilocker.provider";
import { DpiitVerificationProvider } from "./providers/dpiit.provider";
import { GstinVerificationProvider } from "./providers/gstin.provider";
import { IcaiBarCouncilVerificationProvider } from "./providers/icai-bar-council.provider";
import { IncubatorRegistryVerificationProvider } from "./providers/incubator-registry.provider";
import { McaVerificationProvider } from "./providers/mca.provider";
import { PatentOfficeVerificationProvider } from "./providers/patent-office.provider";
import { SebiVerificationProvider } from "./providers/sebi.provider";
import { UgcAicteVerificationProvider } from "./providers/ugc-aicte.provider";
import { VerificationProviderRegistry } from "./providers/verification-provider.registry";
import { WorkDomainEmailVerificationProvider } from "./providers/work-domain-email.provider";
import { SmsService } from "./sms.service";
import { VerificationEngineService } from "./verification-engine.service";
import { VerificationOrchestratorService } from "./verification-orchestrator.service";
import { VerificationController } from "./verification.controller";

/**
 * Two halves: VerificationEngineService is purely reactive (listens for
 * `profile.upserted`, recomputes verificationStatus automatically — no admin
 * approve/reject anywhere, CLAUDE.md §6). VerificationOrchestratorService +
 * the provider registry is the explicit-trigger half — a caller (or, later,
 * an onboarding step) asks to run one named check against their own profile;
 * every registry provider degrades to a PENDING placeholder until its API key
 * is configured, never a manual-review queue.
 */
@Module({
  imports: [AuditLogModule, StartupsModule],
  controllers: [VerificationController],
  providers: [
    VerificationEngineService,
    VerificationOrchestratorService,
    VerificationProviderRegistry,
    McaVerificationProvider,
    GstinVerificationProvider,
    DpiitVerificationProvider,
    SebiVerificationProvider,
    PatentOfficeVerificationProvider,
    UgcAicteVerificationProvider,
    IcaiBarCouncilVerificationProvider,
    DigilockerVerificationProvider,
    WorkDomainEmailVerificationProvider,
    IncubatorRegistryVerificationProvider,
    SmsService,
    PhoneVerificationService,
  ],
  exports: [VerificationOrchestratorService],
})
export class VerificationModule {}
