import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import { DocumentType } from "@vittamhub/types";

import type { PrismaService } from "../../database/prisma/prisma.service";
import type { AuditLogService } from "../audit-log/audit-log.service";
import { MediaService } from "../media/media.service";

import { DocumentsService } from "./documents.service";

const OWNED_CDN = "https://media.vittamhub.com";
const PRIVATE_PREFIX = "https://acct.r2.cloudflarestorage.com/vittamhub-docs";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const OBJECT = "33333333-3333-4333-8333-333333333333";

const STORAGE: Record<string, string> = {
  STORAGE_ENDPOINT: "https://acct.r2.cloudflarestorage.com",
  STORAGE_BUCKET: "vittamhub-docs",
  STORAGE_PUBLIC_BUCKET: "vittamhub-media",
  STORAGE_ACCESS_KEY_ID: "key",
  STORAGE_SECRET_ACCESS_KEY: "secret",
  STORAGE_PUBLIC_CDN_URL: OWNED_CDN,
};

function setup() {
  const prisma = {
    document: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
  };
  const eventEmitter = { emit: jest.fn() };
  const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => STORAGE[key] ?? fallback) };

  // The real MediaService, so the ownership rule under test is the one that
  // ships. Documents live in the PRIVATE bucket, so their stored URL is the
  // S3-API form, not the public CDN one.
  const mediaService = new MediaService(configService as unknown as ConfigService);
  const deleteByUrl = jest.spyOn(mediaService, "deleteByUrl").mockResolvedValue(undefined);

  const service = new DocumentsService(
    prisma as unknown as PrismaService,
    eventEmitter as unknown as EventEmitter2,
    auditLog as unknown as AuditLogService,
    configService as unknown as ConfigService,
    mediaService,
  );

  return { service, prisma, deleteByUrl };
}

describe("DocumentsService.upload", () => {
  it("rejects a fileUrl that doesn't belong to VittamHub's own storage domain", async () => {
    const { service } = setup();

    await expect(
      service.upload(USER_ID, { type: DocumentType.PITCH_DECK, fileUrl: "https://evil.example.com/steal.pdf", fileName: "deck.pdf" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects a file another member uploaded, so nobody can register someone else's document as their own", async () => {
    const { service, prisma } = setup();

    await expect(
      service.upload(USER_ID, {
        type: DocumentType.PITCH_DECK,
        fileUrl: `${PRIVATE_PREFIX}/documents/${OTHER_USER_ID}/${OBJECT}`,
        fileName: "their-deck.pdf",
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it("accepts the caller's own upload and never returns fileUrl in the response", async () => {
    const { service, prisma } = setup();
    const created = {
      id: "doc-1",
      userId: USER_ID,
      type: DocumentType.PITCH_DECK,
      fileUrl: `${PRIVATE_PREFIX}/documents/${USER_ID}/${OBJECT}`,
      fileName: "deck.pdf",
      uploadedAt: new Date(),
      verifiedAt: null,
    };
    prisma.document.create.mockResolvedValue(created);

    const result = await service.upload(USER_ID, { type: DocumentType.PITCH_DECK, fileUrl: created.fileUrl, fileName: "deck.pdf" });

    expect(result).not.toHaveProperty("fileUrl");
    expect(result.id).toBe("doc-1");
  });
});

describe("DocumentsService.remove", () => {
  const stored = {
    id: "doc-1",
    userId: USER_ID,
    type: DocumentType.PITCH_DECK,
    fileUrl: `${PRIVATE_PREFIX}/documents/${USER_ID}/${OBJECT}`,
    fileName: "deck.pdf",
    uploadedAt: new Date(),
    verifiedAt: null,
  };

  it("deletes the stored file along with the record", async () => {
    const { service, prisma, deleteByUrl } = setup();
    prisma.document.findUnique.mockResolvedValue(stored);
    prisma.document.delete.mockResolvedValue(stored);

    await service.remove(USER_ID, "doc-1");

    expect(deleteByUrl).toHaveBeenCalledWith(stored.fileUrl);
  });

  it("won't delete a document that belongs to someone else", async () => {
    const { service, prisma, deleteByUrl } = setup();
    prisma.document.findUnique.mockResolvedValue(stored);

    await expect(service.remove(OTHER_USER_ID, "doc-1")).rejects.toThrow();
    expect(prisma.document.delete).not.toHaveBeenCalled();
    expect(deleteByUrl).not.toHaveBeenCalled();
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
        fileUrl: `${PRIVATE_PREFIX}/documents/${USER_ID}/${OBJECT}`,
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
