import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";

import { RelationshipClaimsService } from "./relationship-claims.service";
import { RelationshipClaimsController } from "./relationships.controller";

@Module({
  imports: [AuditLogModule],
  controllers: [RelationshipClaimsController],
  providers: [RelationshipClaimsService],
  exports: [RelationshipClaimsService],
})
export class RelationshipsModule {}
