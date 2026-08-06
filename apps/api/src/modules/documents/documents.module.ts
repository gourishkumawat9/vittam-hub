import { Module } from "@nestjs/common";

import { AuditLogModule } from "../audit-log/audit-log.module";
import { MediaModule } from "../media/media.module";

import { DocumentAccessService } from "./document-access.service";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

@Module({
  imports: [AuditLogModule, MediaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentAccessService],
})
export class DocumentsModule {}
