import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Document } from "@prisma/client";
import type { DocumentUploadInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { MediaService } from "../media/media.service";

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
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Rejects any fileUrl that isn't a VittamHub-managed storage object the
   * caller uploaded themselves. That rules out registering an arbitrary
   * external URL as a "document" (which would let a user point other people's
   * viewers at a tracking pixel or a phishing page), and registering someone
   * else's stored file to read it through a signed link of your own.
   * Delegates to MediaService so the accepted shapes stay in one place.
   */
  assertOwnedStorageUrl(userId: string, fileUrl: string) {
    if (!this.mediaService.isOwnedBy(fileUrl, userId)) {
      throw new BadRequestException("fileUrl must reference a file you uploaded via /v1/media/upload-url");
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
    this.assertOwnedStorageUrl(userId, input.fileUrl);

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
    // "Delete" has to mean the file is gone, not just unlisted. Skipped when
    // another row still points at the same object.
    const stillReferenced = await this.prisma.document.count({ where: { fileUrl: document.fileUrl } });
    if (stillReferenced === 0) await this.mediaService.deleteByUrl(document.fileUrl);
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
