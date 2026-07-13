import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: this.configService.get("STORAGE_ENDPOINT"),
      region: this.configService.get("STORAGE_REGION", "auto"),
      credentials: {
        accessKeyId: this.configService.get("STORAGE_ACCESS_KEY_ID", ""),
        secretAccessKey: this.configService.get("STORAGE_SECRET_ACCESS_KEY", ""),
      },
    });
  }

  /**
   * Returns a short-lived PUT URL so the browser uploads straight to R2 —
   * files never transit through our API process. Caller (e.g. logo upload
   * form) PUTs directly to `uploadUrl`, then persists `publicUrl` on the
   * owning record (Startup.logoUrl, User.avatarUrl, ...).
   */
  async createUploadUrl(mimeType: string, folder: "logos" | "avatars" | "documents" | "resumes") {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    const key = `${folder}/${randomUUID()}`;
    const bucket = this.configService.get("STORAGE_BUCKET", "");

    // A presigned PUT can't cap the byte size the client sends — enforcing a
    // max upload size needs an S3 POST policy (content-length-range condition)
    // instead; switch to that before launch if abuse via oversized uploads is a concern.
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }),
      { expiresIn: 300 },
    );

    return { uploadUrl, publicUrl: `${this.configService.get("STORAGE_PUBLIC_CDN_URL")}/${key}` };
  }
}
