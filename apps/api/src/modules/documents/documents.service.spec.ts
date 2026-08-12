import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import { DocumentType } from "@vittamhub/types";

import type { PrismaService } from "../../database/prisma/prisma.service";
import type { AuditLogService } from "../audit-log/audit-log.service";
import type { MediaService } from "../media/media.service";

import { DocumentsService } from "./documents.service";

const OWNED_CDN = "https://media.vittamhub.com";
const PRIVATE_PREFIX = "https://acct.r2.cloudflarestorage.com/vittamhub-docs";

function setup() {
  const prisma = { document: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() } };
  const eventEmitter = { emit: jest.fn() };
  const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue(OWNED_CDN) };

  // Documents live in the PRIVATE bucket, so their stored URL is the S3-API
  // form, not the public CDN one — the ownership guard must accept both.
  const mediaService = { storageUrlPrefixes: () => [`${OWNED_CDN}/`, `${PRIVATE_PREFIX}/`] };

  const service = new DocumentsService(
    prisma as unknown as PrismaService,
    eventEmitter as unknown as EventEmitter2,
    auditLog as unknown as AuditLogService,
    configService as unknown as ConfigService,
    mediaService as unknown as MediaService,
  );

  return { service, prisma };
}

describe("DocumentsService.upload", () => {
  it("rejects a fileUrl that doesn't belong to VittamHub's own storage domain", async () => {
    const { service } = setup();

    await expect(
      service.upload("user-1", { type: DocumentType.PITCH_DECK, fileUrl: "https://evil.example.com/steal.pdf", fileName: "deck.pdf" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("accepts a fileUrl under the configured storage CDN and never returns fileUrl in the response", async () => {
    const { service, prisma } = setup();
    const created = {
      id: "doc-1",
      userId: "user-1",
      type: DocumentType.PITCH_DECK,
      fileUrl: `${OWNED_CDN}/documents/some-uuid`,
      fileName: "deck.pdf",
      uploadedAt: new Date(),
      verifiedAt: null,
    };
    prisma.document.create.mockResolvedValue(created);

    const result = await service.upload("user-1", { type: DocumentType.PITCH_DECK, fileUrl: created.fileUrl, fileName: "deck.pdf" });

    expect(result).not.toHaveProperty("fileUrl");
    expect(result.id).toBe("doc-1");
  });
});

describe("DocumentsService.listForUser", () => {
  it("never includes fileUrl in listed documents", async () => {
    const { service, prisma } = setup();
    prisma.document.findMany.mockResolvedValue([
      {
        id: "doc-1",
        userId: "user-1",
        type: DocumentType.PITCH_DECK,
        fileUrl: `${OWNED_CDN}/documents/some-uuid`,
        fileName: "deck.pdf",
        uploadedAt: new Date(),
        verifiedAt: null,
      },
    ]);

    const result = await service.listForUser("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("fileUrl");
  });
});
