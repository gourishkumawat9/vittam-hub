import { apiRequest } from "../http";

export type UploadFolder = "logos" | "avatars" | "documents" | "resumes";

export const mediaApi = {
  createUploadUrl: (mimeType: string, folder: UploadFolder) =>
    apiRequest<{ uploadUrl: string; uploadFields: Record<string, string>; publicUrl: string }>("/v1/media/upload-url", {
      method: "POST",
      body: { mimeType, folder },
    }),
};

/**
 * Requests a presigned POST policy and posts the file directly to storage as
 * multipart form data — a POST policy (not a PUT URL) is what lets the
 * storage provider itself enforce a max file size via `content-length-range`,
 * so the API process never has to trust a client-reported size. Never touches
 * the file bytes on our server either way.
 */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  const { uploadUrl, uploadFields, publicUrl } = await mediaApi.createUploadUrl(file.type, folder);

  const formData = new FormData();
  Object.entries(uploadFields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", file);

  const response = await fetch(uploadUrl, { method: "POST", body: formData });
  if (!response.ok) {
    // Storage providers answer with an XML <Error><Code>…</Code></Error> body.
    // Surfacing that code turns an unactionable "File upload failed" into
    // something diagnosable — EntityTooLarge (over the size cap) and
    // AccessDenied / CORS rejections look identical to a user otherwise.
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
