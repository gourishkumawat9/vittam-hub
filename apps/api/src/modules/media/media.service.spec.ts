import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

import { MediaService } from "./media.service";

const FULL_CONFIG: Record<string, string> = {
  STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  STORAGE_BUCKET: "vittamhub-docs", // private — documents, resumes
  STORAGE_PUBLIC_BUCKET: "vittamhub-media", // public — logos, avatars
  STORAGE_ACCESS_KEY_ID: "key",
  STORAGE_SECRET_ACCESS_KEY: "secret",
  STORAGE_PUBLIC_CDN_URL: "https://media.vittamhub.com",
  STORAGE_REGION: "auto",
};

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

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

    await expect(service.createUploadUrl("application/pdf", "documents", USER_ID)).rejects.toThrow(ServiceUnavailableException);
  });

  it("names the missing variables so the failure is actionable", async () => {
    const service = setup({ STORAGE_PUBLIC_CDN_URL: undefined });

    await expect(service.createUploadUrl("application/pdf", "documents", USER_ID)).rejects.toThrow(/STORAGE_PUBLIC_CDN_URL/);
  });

  it("refuses to sign a download URL when storage is not configured", async () => {
    const service = setup({ STORAGE_ENDPOINT: undefined });

    await expect(service.getSignedDownloadUrl("documents/abc")).rejects.toThrow(ServiceUnavailableException);
  });

  it("rejects a disallowed mime type as a client error, not a 500", async () => {
    const service = setup();

    await expect(service.createUploadUrl("application/x-msdownload", "documents", USER_ID)).rejects.toThrow(BadRequestException);
  });

  it("mints a presigned upload when fully configured", async () => {
    const service = setup();

    const result = await service.createUploadUrl("application/pdf", "documents", USER_ID);

    expect(result.uploadUrl).toContain("r2.cloudflarestorage.com");
    expect(result.uploadFields).toBeDefined();
  });

  /**
   * The split that keeps the data room private: a public custom domain on the
   * documents bucket would make every pitch deck world-readable by URL, with
   * no expiry and no grant check.
   */
  it("keeps private folders off the public CDN domain", async () => {
    const service = setup();

    const doc = await service.createUploadUrl("application/pdf", "documents", USER_ID);

    expect(doc.publicUrl).not.toContain("media.vittamhub.com");
    expect(doc.publicUrl).toMatch(
      /^https:\/\/account\.r2\.cloudflarestorage\.com\/vittamhub-docs\/documents\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/,
    );
  });

  it("puts public folders on the CDN domain so <img> can load them", async () => {
    const service = setup();

    const logo = await service.createUploadUrl("image/png", "logos", USER_ID);

    expect(logo.publicUrl).toMatch(/^https:\/\/media\.vittamhub\.com\/logos\//);
  });

  it("round-trips both URL shapes back to a storage key", () => {
    const service = setup();

    expect(service.extractKeyFromPublicUrl("https://media.vittamhub.com/logos/abc-123")).toBe("logos/abc-123");
    expect(
      service.extractKeyFromPublicUrl("https://account.r2.cloudflarestorage.com/vittamhub-docs/documents/abc-123"),
    ).toBe("documents/abc-123");
  });

  it("refuses to turn a URL from an unrelated host into a storage key", () => {
    const service = setup();

    expect(() => service.extractKeyFromPublicUrl("https://evil.example.com/documents/abc")).toThrow();
  });
});

describe("MediaService upload ownership", () => {
  const PRIVATE = "https://account.r2.cloudflarestorage.com/vittamhub-docs";
  const OBJECT = "33333333-3333-4333-8333-333333333333";

  it("stores a file under its uploader, and only that uploader owns it", async () => {
    const service = setup();

    const { publicUrl } = await service.createUploadUrl("application/pdf", "documents", USER_ID);

    expect(publicUrl).toContain(`/documents/${USER_ID}/`);
    expect(service.isOwnedBy(publicUrl, USER_ID)).toBe(true);
    expect(service.isOwnedBy(publicUrl, OTHER_USER_ID)).toBe(false);
  });

  /**
   * The case this exists for: someone who was once given a signed link to a
   * document has seen its storage key. Registering that key as their own
   * document would let them mint fresh links after the owner revoked access.
   */
  it("refuses another member's file, whatever folder it is in", () => {
    const service = setup();

    expect(service.isOwnedBy(`${PRIVATE}/documents/${OTHER_USER_ID}/${OBJECT}`, USER_ID)).toBe(false);
    expect(service.isOwnedBy(`https://media.vittamhub.com/logos/${OTHER_USER_ID}/${OBJECT}`, USER_ID)).toBe(false);
  });

  it("still accepts a file stored before keys carried the uploader", () => {
    const service = setup();

    expect(service.isOwnedBy(`${PRIVATE}/documents/${OBJECT}`, USER_ID)).toBe(true);
  });

  it("refuses anything that isn't one of this deployment's objects", () => {
    const service = setup();

    expect(service.isOwnedBy("https://evil.example.com/documents/abc", USER_ID)).toBe(false);
    expect(service.isOwnedBy(`${PRIVATE}/documents/${USER_ID}/${OBJECT}/extra`, USER_ID)).toBe(false);
    expect(service.isOwnedBy(`${PRIVATE}/documents/${USER_ID}/not-a-uuid`, USER_ID)).toBe(false);
    expect(service.isOwnedBy(`${PRIVATE}/documents/not-a-uuid`, USER_ID)).toBe(false);
  });

  it("only takes pictures in the public folders", async () => {
    const service = setup();

    await expect(service.createUploadUrl("application/pdf", "logos", USER_ID)).rejects.toThrow(BadRequestException);
    await expect(service.createUploadUrl("text/csv", "avatars", USER_ID)).rejects.toThrow(BadRequestException);
    await expect(service.createUploadUrl("image/webp", "avatars", USER_ID)).resolves.toBeDefined();
  });
});
