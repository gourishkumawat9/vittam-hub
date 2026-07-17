import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";
import { StartupsModule } from "../startups/startups.module";

import { VerificationEngineService } from "./verification-engine.service";

/**
 * Purely reactive — no controller. Listens for `profile.upserted` (emitted by
 * documents/startups/investors/onboarding publishers) and recomputes
 * verificationStatus automatically — no admin approve/reject anywhere (CLAUDE.md §6).
 */
@Module({
  imports: [AuditLogModule, StartupsModule],
  providers: [VerificationEngineService],
})
export class VerificationModule {}
