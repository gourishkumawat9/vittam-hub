import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
]);

/** The only types a public folder takes: they are shown to anyone, straight from the CDN, as pictures. */
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UploadFolder = "logos" | "avatars" | "pictures" | "documents" | "resumes";

/**
 * Folders whose objects are rendered directly in `<img src=…>` on **public**
 * marketing pages (a startup's logo on /startups/[slug], an avatar in a
 * thread), so they must be world-readable over the CDN domain.
 *
 * Everything not listed here — pitch decks, cap tables, financials, resumes —
 * lives in a separate PRIVATE bucket with no public domain mapped to it, and
 * is only ever reachable through a short-lived signed URL minted after
 * DocumentAccessService has checked the grant.
 *
 * This split is load-bearing. With a single bucket, attaching the R2 custom
 * domain needed for logos would make every object under it publicly readable
 * by URL — including `documents/<uuid>` — with no expiry and no grant check,
 * silently defeating the entire data room.
 */
// "pictures" holds the images a profile shows: a milestone's evidence and the
// product screenshots. They used to be stored with the private documents, so
// they showed as broken images and their links opened "access denied".
const PUBLIC_FOLDERS = new Set<UploadFolder>(["logos", "avatars", "pictures"]);

/**
 * Per-folder max upload size. The browser says how big the file is, the size
 * is checked against this, and that exact size is then signed into the upload
 * link, so storage itself refuses a body of any other length.
 */
const MAX_UPLOAD_BYTES: Record<UploadFolder, number> = {
  logos: 5 * 1024 * 1024,
  avatars: 5 * 1024 * 1024,
  pictures: 5 * 1024 * 1024,
  documents: 20 * 1024 * 1024,
  resumes: 10 * 1024 * 1024,
};

/** Every setting that must be present before a single byte can be stored or served. */
const REQUIRED_STORAGE_VARS = [
  "STORAGE_ENDPOINT",
  "STORAGE_BUCKET", // private — documents, resumes
  "STORAGE_PUBLIC_BUCKET", // public — logos, avatars (the CDN domain maps here)
  "STORAGE_ACCESS_KEY_ID",
  "STORAGE_SECRET_ACCESS_KEY",
  "STORAGE_PUBLIC_CDN_URL",
] as const;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: this.configService.get("STORAGE_ENDPOINT"),
      region: this.configService.get("STORAGE_REGION", "auto"),
      credentials: {
        accessKeyId: this.configService.get("STORAGE_ACCESS_KEY_ID", ""),
        secretAccessKey: this.configService.get("STORAGE_SECRET_ACCESS_KEY", ""),
      },
      // Cloudflare R2 doesn't take the CRC32 checksums newer SDK versions add
      // to every request by default. Left on, the SDK also writes the checksum
      // of an empty body into each upload link, which no real file matches.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    const missing = this.missingStorageVars();
    if (missing.length > 0) {
      this.logger.warn(`Object storage is not configured — uploads will be refused. Missing: ${missing.join(", ")}`);
    }
  }

  private missingStorageVars(): string[] {
    return REQUIRED_STORAGE_VARS.filter((key) => !this.configService.get<string>(key));
  }

  /**
   * Fail closed when storage isn't configured.
   *
   * This is not defensive padding — it fixes a real fail-open bug. With the
   * STORAGE_* vars unset, signing does NOT throw: it happily returns a
   * well-formed link pointing at `https://s3.auto.amazonaws.com/` (the SDK's
   * default endpoint), so the API answered 200 and the browser then sent the
   * user's pitch deck to an unrelated Amazon endpoint before failing with an
   * opaque "File upload failed". `publicUrl` was
   * simultaneously being built as the literal string "undefined/documents/…".
   * Refusing loudly is the only safe behaviour.
   */
  private assertStorageConfigured(): void {
    const missing = this.missingStorageVars();
    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `File storage is not configured on this environment, so uploads are disabled. Missing: ${missing.join(", ")}.`,
      );
    }
  }

  /**
   * Returns a short-lived signed link the browser PUTs the file to, so files
   * go straight to storage and never through this API process.
   *
   * This was a presigned POST form, chosen because its policy can cap the
   * size. Cloudflare R2, the store this project is set up for, does not
   * accept form uploads at all ("POST ... is not currently supported"), so no
   * upload could ever have worked there. A signed PUT works on R2 and on S3.
   * The size cap is kept by signing the `Content-Length` header: the link is
   * only valid for a body of exactly the size that was checked here, and
   * only with the content type that was checked here.
   *
   * The caller PUTs the file to `uploadUrl` with `uploadHeaders`, then
   * persists `publicUrl` on the owning record (Startup.logoUrl, a Document
   * row, ...). The bucket needs a CORS rule that lets the website's origin
   * PUT with a Content-Type header: see docs/10-deployment-infrastructure.md.
   */
  async createUploadUrl(mimeType: string, folder: UploadFolder, userId: string, sizeBytes: number) {
    this.assertStorageConfigured();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      // BadRequest, not a bare Error — a rejected file type is the caller's
      // problem to correct, and a raw throw surfaced it as an opaque 500.
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
    // Logos and avatars are served to everyone from the CDN domain. Letting a
    // PDF or a spreadsheet in there would turn it into free public file
    // hosting under VittamHub's own name.
    if (PUBLIC_FOLDERS.has(folder) && !IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException("Only PNG, JPEG or WebP images can be uploaded here");
    }
    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException("That file is empty");
    }
    if (sizeBytes > MAX_UPLOAD_BYTES[folder]) {
      throw new BadRequestException(`That file is too large. The limit here is ${MAX_UPLOAD_BYTES[folder] / (1024 * 1024)} MB.`);
    }

    // Key is `<folder>/<uploader>/<uuid>`: the folder comes from a closed enum
    // validated at the controller, the uploader is the signed-in user's id and
    // the filename is a server-generated UUID, so no user-controlled string
    // ever reaches the object key. Carrying the uploader in the key is what
    // lets `isOwnedBy` refuse a file somebody else uploaded. The original
    // filename is stored on the Document row, never in storage.
    const key = `${folder}/${userId}/${randomUUID()}`;

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucketFor(folder), Key: key, ContentType: mimeType, ContentLength: sizeBytes }),
      // Both headers are part of the signature: a different type or a different length fails at storage.
      { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) },
    );

    return { uploadUrl, uploadHeaders: { "Content-Type": mimeType }, publicUrl: this.objectUrl(folder, key) };
  }

  private bucketFor(folder: UploadFolder): string {
    return PUBLIC_FOLDERS.has(folder)
      ? this.configService.get("STORAGE_PUBLIC_BUCKET", "")
      : this.configService.get("STORAGE_BUCKET", "");
  }

  /**
   * The stable reference persisted on the owning record.
   *
   * Public folders get the CDN domain, because a browser loads them directly.
   * Private folders deliberately get the S3-API form
   * (`<endpoint>/<bucket>/<key>`) — a well-formed URL that satisfies the
   * `z.string().url()` contract on DocumentUploadInput, but which returns 401
   * to anyone who fetches it without a signature. It is a locator, not an
   * access grant.
   */
  private objectUrl(folder: UploadFolder, key: string): string {
    if (PUBLIC_FOLDERS.has(folder)) {
      return `${this.configService.get("STORAGE_PUBLIC_CDN_URL")}/${key}`;
    }
    return `${this.configService.get("STORAGE_ENDPOINT")}/${this.configService.get("STORAGE_BUCKET")}/${key}`;
  }

  /**
   * Recovers the raw storage key from a `publicUrl` previously returned by
   * `createUploadUrl` — `Document.fileUrl` only stores that composed URL, not
   * the key separately, so this is how a gated document's access path gets
   * back to something `getSignedDownloadUrl` can sign.
   */
  extractKeyFromPublicUrl(publicUrl: string): string {
    // Accepts both shapes produced by objectUrl(): the public CDN form and the
    // private S3-API form. Anything else is rejected rather than guessed at,
    // so a URL from an unrelated host can never be turned into a signed read.
    for (const prefix of this.storageUrlPrefixes()) {
      if (publicUrl.startsWith(prefix)) return publicUrl.slice(prefix.length);
    }
    throw new Error("Not a recognized storage URL");
  }

  /** The URL prefixes this deployment considers its own. */
  storageUrlPrefixes(): string[] {
    return [
      `${this.configService.get("STORAGE_PUBLIC_CDN_URL")}/`,
      `${this.configService.get("STORAGE_ENDPOINT")}/${this.configService.get("STORAGE_BUCKET")}/`,
    ];
  }

  /** True when `url` points at one of this deployment's own stored objects (and not, say, at a link somebody pasted). */
  isStorageUrl(url: string): boolean {
    if (this.missingStorageVars().length > 0) return false;
    return this.storageUrlPrefixes().some((prefix) => url.startsWith(prefix));
  }

  /**
   * True when `storedUrl` is one of this deployment's objects and `userId` is
   * the person who uploaded it.
   *
   * A storage URL is only a locator, so without this anyone who learned
   * another member's document URL (a signed link they were once given shows
   * the key) could register it as their own document and keep reading it after
   * the owner revoked their access.
   *
   * Objects uploaded before keys carried the uploader are `<folder>/<uuid>`.
   * Those can't be attributed, so they stay accepted; nothing new is ever
   * stored in that shape.
   */
  isOwnedBy(storedUrl: string, userId: string): boolean {
    let key: string;
    try {
      key = this.extractKeyFromPublicUrl(storedUrl);
    } catch {
      return false;
    }
    const parts = key.split("/");
    if (parts.length === 3) return parts[1] === userId && UUID.test(parts[2] ?? "");
    return parts.length === 2 && UUID.test(parts[1] ?? "");
  }

  /**
   * Stricter than `isOwnedBy`: true only when the object's key names `userId`
   * as its uploader. Used before deleting, where an unattributable legacy
   * object must be left alone instead of given the benefit of the doubt.
   */
  wasUploadedBy(storedUrl: string, userId: string): boolean {
    let key: string;
    try {
      key = this.extractKeyFromPublicUrl(storedUrl);
    } catch {
      return false;
    }
    const parts = key.split("/");
    return parts.length === 3 && parts[1] === userId && UUID.test(parts[2] ?? "");
  }

  /**
   * Removes a stored object. Best-effort by design: the database row is the
   * record of what a member has on file, so a storage hiccup must not stop
   * them deleting a document or their account. A failure is logged for a
   * later sweep instead.
   */
  async deleteByUrl(storedUrl: string): Promise<void> {
    if (this.missingStorageVars().length > 0) return;
    try {
      const key = this.extractKeyFromPublicUrl(storedUrl);
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketForUrl(storedUrl), Key: key }));
    } catch (err) {
      this.logger.warn(`Could not delete a stored object: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Which bucket a previously-stored URL lives in — private unless it came from the public CDN. */
  bucketForUrl(storedUrl: string): string {
    const cdnPrefix = `${this.configService.get("STORAGE_PUBLIC_CDN_URL")}/`;
    return storedUrl.startsWith(cdnPrefix)
      ? this.configService.get("STORAGE_PUBLIC_BUCKET", "")
      : this.configService.get("STORAGE_BUCKET", "");
  }

  /**
   * A short-lived, single-purpose signed GET URL — this is what gated
   * documents (`documents`/`resumes` folders) must be served through instead
   * of a permanent public URL, so that revoking a DocumentGrant actually
   * revokes access: once the signature expires, the URL stops working
   * regardless of who has it, and no *new* one can be minted without passing
   * DocumentAccessService.access()'s grant check again.
   */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 300, bucket?: string): Promise<string> {
    // Same fail-closed rule as uploads: unconfigured storage would otherwise
    // hand back a signed URL for `s3.auto.amazonaws.com`, which looks valid
    // and silently 404s for the viewer.
    this.assertStorageConfigured();
    // Defaults to the private bucket — the only one that needs signing.
    const target = bucket ?? this.configService.get("STORAGE_BUCKET", "");
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: target, Key: key }), { expiresIn: expiresInSeconds });
  }
}
