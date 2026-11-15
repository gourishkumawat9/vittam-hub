import { apiRequest } from "../http";

/** "logos", "avatars" and "pictures" are public images; "documents" and "resumes" are private files. */
export type UploadFolder = "logos" | "avatars" | "pictures" | "documents" | "resumes";

export const mediaApi = {
  createUploadUrl: (mimeType: string, folder: UploadFolder, sizeBytes: number) =>
    apiRequest<{ uploadUrl: string; uploadHeaders: Record<string, string>; publicUrl: string }>("/v1/media/upload-url", {
      method: "POST",
      body: { mimeType, folder, sizeBytes },
    }),
};

/** What storage accepts. Checked here first so the person gets a plain reason, not a rejected request. */
const UPLOADABLE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
]);

/**
 * Asks the API for a signed link, then PUTs the file straight to storage; the
 * file never passes through our server. The link is signed for this file's
 * exact size and type, so storage refuses anything else (the size limit is
 * checked by the API before it signs).
 */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  if (!UPLOADABLE_TYPES.has(file.type)) {
    throw new Error("That file type can't be uploaded. Use a PDF, an image (PNG, JPEG or WebP), a Word or Excel file, or a CSV.");
  }
  if (file.size === 0) throw new Error("That file is empty.");

  const { uploadUrl, uploadHeaders, publicUrl } = await mediaApi.createUploadUrl(file.type, folder, file.size);

  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: "PUT", headers: uploadHeaders, body: file });
  } catch {
    // The browser gives no detail when storage is unreachable or refuses the site's origin.
    throw new Error("The file couldn't reach storage. Check your connection and try again.");
  }
  if (!response.ok) {
    // Storage providers answer with an XML <Error><Code>…</Code></Error> body.
    // Surfacing that code turns an unactionable "File upload failed" into
    // something diagnosable.
    const body = await response.text().catch(() => "");
    const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
    const detail = code ?? `HTTP ${response.status}`;
    throw new Error(
      code === "EntityTooLarge"
        ? "That file is too large for this upload type."
        : `Upload to storage failed (${detail}). If this persists, storage may be misconfigured.`,
    );
  }
  return publicUrl;
}
