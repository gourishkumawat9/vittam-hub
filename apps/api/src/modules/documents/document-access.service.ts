import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateDocumentGrantInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

/**
 * Bundle 21 — the permissioned data room. A gated document is never handed
 * out by raw URL; access always goes through `access()`, which checks for an
 * active (non-expired, non-revoked, NDA-satisfied-if-required) grant, logs
 * the view, and only then returns the file. Watermarking the file itself is
 * future work (needs a real media-processing step) — see docs/STATUS.md.
 */
@Injectable()
export class DocumentAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  private async ownedDocument(ownerId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.userId !== ownerId) throw new NotFoundException("Document not found");
    return document;
  }

  async grant(founderId: string, documentId: string, input: CreateDocumentGrantInput) {
    await this.ownedDocument(founderId, documentId);

    const recipient = await this.prisma.user.findUnique({ where: { id: input.grantedToId } });
    if (!recipient) throw new NotFoundException("Recipient not found");

    const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
    const grant = await this.prisma.documentGrant.upsert({
      where: { documentId_grantedToId: { documentId, grantedToId: input.grantedToId } },
      create: {
        documentId,
        grantedToId: input.grantedToId,
        grantedById: founderId,
        expiresAt,
        requireNda: input.requireNda,
      },
      // Re-sharing after expiry/revocation resets the grant cleanly rather than piling up duplicate rows.
      update: { expiresAt, requireNda: input.requireNda, revokedAt: null, ndaAcceptedAt: null },
    });

    this.eventEmitter.emit("document-grant.created", { recipientId: input.grantedToId, granterId: founderId, documentId });
    await this.auditLog.record({
      actorId: founderId,
      action: "document_grant.created",
      entityType: "Document",
      entityId: documentId,
      metadata: { grantedToId: input.grantedToId, expiresAt: expiresAt.toISOString() },
    });

    return grant;
  }

  async revoke(founderId: string, grantId: string) {
    const grant = await this.prisma.documentGrant.findUnique({ where: { id: grantId }, include: { document: true } });
    if (!grant || grant.document.userId !== founderId) throw new NotFoundException("Grant not found");

    const updated = await this.prisma.documentGrant.update({ where: { id: grantId }, data: { revokedAt: new Date() } });
    await this.auditLog.record({
      actorId: founderId,
      action: "document_grant.revoked",
      entityType: "Document",
      entityId: grant.documentId,
      metadata: { grantedToId: grant.grantedToId },
    });
    return updated;
  }

  async acceptNda(viewerId: string, grantId: string) {
    const grant = await this.prisma.documentGrant.findUnique({ where: { id: grantId } });
    if (!grant || grant.grantedToId !== viewerId) throw new NotFoundException("Grant not found");
    if (!grant.requireNda) return grant; // nothing to accept
    return this.prisma.documentGrant.update({ where: { id: grantId }, data: { ndaAcceptedAt: new Date() } });
  }

  /** The one path anyone should ever go through to read a gated document — owner included, so the view log stays honest about who's real traffic vs. the owner checking their own file. */
  async access(viewerId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException("Document not found");

    if (document.userId === viewerId) {
      return { fileUrl: document.fileUrl, fileName: document.fileName, type: document.type };
    }

    const now = new Date();
    const grant = await this.prisma.documentGrant.findUnique({
      where: { documentId_grantedToId: { documentId, grantedToId: viewerId } },
    });
    if (!grant || grant.revokedAt || grant.expiresAt < now) {
      throw new ForbiddenException("You don't have access to this document");
    }
    if (grant.requireNda && !grant.ndaAcceptedAt) {
      throw new ForbiddenException("Accept the NDA before viewing this document");
    }

    await this.prisma.documentView.create({ data: { documentId, viewerId } });
    return { fileUrl: document.fileUrl, fileName: document.fileName, type: document.type };
  }

  /** The founder's view: who has access, and how many times they've actually opened it — "Blume opened your deck twice" (spec §21). */
  async listGrantsWithViews(founderId: string, documentId: string) {
    await this.ownedDocument(founderId, documentId);

    const grants = await this.prisma.documentGrant.findMany({
      where: { documentId },
      include: { grantedTo: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const views = await this.prisma.documentView.groupBy({
      by: ["viewerId"],
      where: { documentId },
      _count: { _all: true },
      _max: { viewedAt: true },
    });
    const viewsByViewer = new Map(views.map((v) => [v.viewerId, v]));

    return grants.map((g) => {
      const v = viewsByViewer.get(g.grantedToId);
      return { ...g, viewCount: v?._count._all ?? 0, lastViewedAt: v?._max.viewedAt ?? null };
    });
  }

  /** The investor's view: every document currently shared with me, not yet expired/revoked. */
  listSharedWithMe(viewerId: string) {
    return this.prisma.documentGrant.findMany({
      where: { grantedToId: viewerId, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { document: { select: { id: true, type: true, fileName: true, userId: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
