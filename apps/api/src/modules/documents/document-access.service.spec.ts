import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { EventEmitter2 } from "@nestjs/event-emitter";

import type { PrismaService } from "../../database/prisma/prisma.service";
import type { AuditLogService } from "../audit-log/audit-log.service";
import type { MediaService } from "../media/media.service";

import { DocumentAccessService } from "./document-access.service";

const OWNER_ID = "owner-1";
const VIEWER_ID = "viewer-1";
const DOCUMENT_ID = "doc-1";
const RAW_PUBLIC_URL = "https://media.vittamhub.com/documents/some-uuid";
const SIGNED_URL = "https://media.vittamhub.com/documents/some-uuid?X-Amz-Signature=fake&X-Amz-Expires=300";

function setup() {
  const prisma = {
    document: { findUnique: jest.fn() },
    documentGrant: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    documentView: { create: jest.fn(), groupBy: jest.fn() },
    user: { findUnique: jest.fn() },
    connection: { findFirst: jest.fn() },
  };
  const eventEmitter = { emit: jest.fn() };
  const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
  const mediaService = {
    extractKeyFromPublicUrl: jest.fn().mockReturnValue("documents/some-uuid"),
    getSignedDownloadUrl: jest.fn().mockResolvedValue(SIGNED_URL),
    // Documents live in the private bucket; access() signs against it explicitly.
    bucketForUrl: jest.fn().mockReturnValue("vittamhub-docs"),
  };

  const service = new DocumentAccessService(
    prisma as unknown as PrismaService,
    eventEmitter as unknown as EventEmitter2,
    auditLog as unknown as AuditLogService,
    mediaService as unknown as MediaService,
  );

  return { service, prisma, mediaService, auditLog };
}

function baseDocument() {
  return { id: DOCUMENT_ID, userId: OWNER_ID, fileUrl: RAW_PUBLIC_URL, fileName: "deck.pdf", type: "PITCH_DECK" };
}

describe("DocumentAccessService.access", () => {
  it("throws NotFoundException when the document doesn't exist", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(null);

    await expect(service.access(VIEWER_ID, DOCUMENT_ID)).rejects.toThrow(NotFoundException);
  });

  it("returns a signed URL — never the raw permanent fileUrl — for the owner's own document", async () => {
    const { service, prisma, mediaService } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());

    const result = await service.access(OWNER_ID, DOCUMENT_ID);

    expect(result.fileUrl).toBe(SIGNED_URL);
    expect(result.fileUrl).not.toBe(RAW_PUBLIC_URL);
    expect(mediaService.extractKeyFromPublicUrl).toHaveBeenCalledWith(RAW_PUBLIC_URL);
  });

  it("denies access when no grant exists for the viewer", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.documentGrant.findUnique.mockResolvedValue(null);

    await expect(service.access(VIEWER_ID, DOCUMENT_ID)).rejects.toThrow(ForbiddenException);
  });

  it("denies access once a grant has been revoked — the actual bug this fix closes", async () => {
    const { service, prisma, mediaService } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.documentGrant.findUnique.mockResolvedValue({
      documentId: DOCUMENT_ID,
      grantedToId: VIEWER_ID,
      revokedAt: new Date(), // revoked
      expiresAt: new Date(Date.now() + 86_400_000),
      requireNda: false,
      ndaAcceptedAt: null,
    });

    await expect(service.access(VIEWER_ID, DOCUMENT_ID)).rejects.toThrow(ForbiddenException);
    // No signed URL should ever be minted for a revoked grant.
    expect(mediaService.getSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("denies access once a grant has expired", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.documentGrant.findUnique.mockResolvedValue({
      documentId: DOCUMENT_ID,
      grantedToId: VIEWER_ID,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), // already expired
      requireNda: false,
      ndaAcceptedAt: null,
    });

    await expect(service.access(VIEWER_ID, DOCUMENT_ID)).rejects.toThrow(ForbiddenException);
  });

  it("denies access when the grant requires an NDA that hasn't been accepted yet", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.documentGrant.findUnique.mockResolvedValue({
      documentId: DOCUMENT_ID,
      grantedToId: VIEWER_ID,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      requireNda: true,
      ndaAcceptedAt: null,
    });

    await expect(service.access(VIEWER_ID, DOCUMENT_ID)).rejects.toThrow(ForbiddenException);
  });

  it("grants a signed URL and logs a view for a valid, non-revoked, non-expired grant", async () => {
    const { service, prisma, mediaService } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.documentGrant.findUnique.mockResolvedValue({
      documentId: DOCUMENT_ID,
      grantedToId: VIEWER_ID,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      requireNda: false,
      ndaAcceptedAt: null,
    });

    const result = await service.access(VIEWER_ID, DOCUMENT_ID);

    expect(result.fileUrl).toBe(SIGNED_URL);
    expect(prisma.documentView.create).toHaveBeenCalledWith({ data: { documentId: DOCUMENT_ID, viewerId: VIEWER_ID } });
    expect(mediaService.getSignedDownloadUrl).toHaveBeenCalledWith("documents/some-uuid", 300, "vittamhub-docs");
  });
});

describe("DocumentAccessService.grant", () => {
  const input = { grantedToId: VIEWER_ID, expiresInDays: 14, requireNda: false };

  /**
   * CLAUDE.md §4: document sharing unlocks only after a connect request is
   * accepted. Sharing used to work with any user id, which made it a way to
   * reach any investor directly, with no request and no monthly limit.
   */
  it("refuses to share with someone who hasn't accepted a connect request", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.user.findUnique.mockResolvedValue({ id: VIEWER_ID, deletedAt: null });
    prisma.connection.findFirst.mockResolvedValue(null);

    await expect(service.grant(OWNER_ID, DOCUMENT_ID, input)).rejects.toThrow(ForbiddenException);
    expect(prisma.documentGrant.upsert).not.toHaveBeenCalled();
  });

  it("shares once the two are connected, and only looks for an accepted connection between exactly these two", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue(baseDocument());
    prisma.user.findUnique.mockResolvedValue({ id: VIEWER_ID, deletedAt: null });
    prisma.connection.findFirst.mockResolvedValue({ id: "conn-1" });
    prisma.documentGrant.upsert.mockResolvedValue({ id: "grant-1" });

    await expect(service.grant(OWNER_ID, DOCUMENT_ID, input)).resolves.toEqual({ id: "grant-1" });

    const where = prisma.connection.findFirst.mock.calls[0][0].where;
    expect(where.status).toBe("ACCEPTED");
    expect(where.OR).toEqual([
      { requesterId: OWNER_ID, recipientId: VIEWER_ID },
      { requesterId: VIEWER_ID, recipientId: OWNER_ID },
    ]);
  });

  it("won't share a document the caller doesn't own", async () => {
    const { service, prisma } = setup();
    prisma.document.findUnique.mockResolvedValue({ ...baseDocument(), userId: "someone-else" });

    await expect(service.grant(OWNER_ID, DOCUMENT_ID, input)).rejects.toThrow(NotFoundException);
  });
});
