import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

import { MediaService } from "./media.service";

const FULL_CONFIG: Record<string, string> = {
  STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  STORAGE_BUCKET: "vittamhub-media",
  STORAGE_ACCESS_KEY_ID: "key",
  STORAGE_SECRET_ACCESS_KEY: "secret",
  STORAGE_PUBLIC_CDN_URL: "https://media.vittamhub.com",
  STORAGE_REGION: "auto",
};

function setup(overrides: Record<string, string | undefined> = {}) {
  const values = { ...FULL_CONFIG, ...overrides };
  const configService = {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  };
  return new MediaService(configService as unknown as ConfigService);
}

describe("MediaService storage configuration", () => {
  /**
   * Regression test for a fail-open bug: with STORAGE_* unset,
   * createPresignedPost does not throw — it returns a well-formed policy
   * pointing at the SDK's default endpoint (s3.auto.amazonaws.com), so the
   * API returned 200 and the browser uploaded the user's file to an
   * unrelated host.
   */
  it("refuses to mint an upload URL when storage is not configured", async () => {
    const service = setup({ STORAGE_BUCKET: undefined, STORAGE_ACCESS_KEY_ID: undefined });

    await expect(service.createUploadUrl("application/pdf", "documents")).rejects.toThrow(ServiceUnavailableException);
  });

  it("names the missing variables so the failure is actionable", async () => {
    const service = setup({ STORAGE_PUBLIC_CDN_URL: undefined });

    await expect(service.createUploadUrl("application/pdf", "documents")).rejects.toThrow(/STORAGE_PUBLIC_CDN_URL/);
  });

  it("refuses to sign a download URL when storage is not configured", async () => {
    const service = setup({ STORAGE_ENDPOINT: undefined });

    await expect(service.getSignedDownloadUrl("documents/abc")).rejects.toThrow(ServiceUnavailableException);
  });

  it("rejects a disallowed mime type as a client error, not a 500", async () => {
    const service = setup();

    await expect(service.createUploadUrl("application/x-msdownload", "documents")).rejects.toThrow(BadRequestException);
  });

  it("mints a presigned upload when fully configured", async () => {
    const service = setup();

    const result = await service.createUploadUrl("application/pdf", "documents");

    expect(result.uploadUrl).toContain("r2.cloudflarestorage.com");
    expect(result.publicUrl).toMatch(/^https:\/\/media\.vittamhub\.com\/documents\//);
    expect(result.uploadFields).toBeDefined();
  });

  it("round-trips a public URL back to its storage key", () => {
    const service = setup();

    expect(service.extractKeyFromPublicUrl("https://media.vittamhub.com/documents/abc-123")).toBe("documents/abc-123");
  });
});
