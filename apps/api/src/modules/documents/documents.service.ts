import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Document } from "@prisma/client";
import type { DocumentUploadInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

/**
 * Every role's private document vault — a Document belongs to the uploading
 * user, not a specific role profile. `fileUrl` (the permanent storage URL)
 * is never returned by any method here — callers get a short-lived signed
 * URL only through DocumentAccessService.access(), which enforces the grant
 * check first. See document-access.service.ts for the read path.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
    private readonly configService: ConfigService,
  ) {}

  /** Rejects any fileUrl that isn't a VittamHub-managed storage object — prevents registering an arbitrary external URL as a "document". */
  private assertOwnedStorageUrl(fileUrl: string) {
    const prefix = `${this.configService.get("STORAGE_PUBLIC_CDN_URL")}/`;
    if (!fileUrl.startsWith(prefix)) {
      throw new BadRequestException("fileUrl must reference a file uploaded via /v1/media/upload-url");
    }
  }

  private omitFileUrl(document: Document): Omit<Document, "fileUrl"> {
    const { id, userId, type, fileName, uploadedAt, verifiedAt } = document;
    return { id, userId, type, fileName, uploadedAt, verifiedAt };
  }

  async listForUser(userId: string) {
    const documents = await this.prisma.document.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" } });
    return documents.map((d) => this.omitFileUrl(d));
  }

  async upload(userId: string, input: DocumentUploadInput) {
    this.assertOwnedStorageUrl(input.fileUrl);

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
    return this.omitFileUrl(document);
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
    return this.omitFileUrl(removed);
  }
}
