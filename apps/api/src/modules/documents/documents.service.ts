import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { DocumentUploadInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

/** Every role's private document vault — a Document belongs to the uploading user, not a specific role profile. */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.document.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" } });
  }

  async upload(userId: string, input: DocumentUploadInput) {
    const document = await this.prisma.document.create({ data: { userId, ...input } });
    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    // Never log the file URL itself — the audit log shouldn't become a second, less-protected index of sensitive documents.
    await this.auditLog.record({
      actorId: userId,
      action: "document.uploaded",
      entityType: "Document",
      entityId: document.id,
      metadata: { type: input.type },
    });
    return document;
  }

  async remove(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.userId !== userId) throw new NotFoundException("Document not found");
    const removed = await this.prisma.document.delete({ where: { id: documentId } });
    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    await this.auditLog.record({
      actorId: userId,
      action: "document.deleted",
      entityType: "Document",
      entityId: documentId,
      metadata: { type: document.type },
    });
    return removed;
  }
}
