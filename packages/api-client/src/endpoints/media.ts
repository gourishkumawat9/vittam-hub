import { apiRequest } from "../http";

export type UploadFolder = "logos" | "avatars" | "documents" | "resumes";

export const mediaApi = {
  createUploadUrl: (mimeType: string, folder: UploadFolder) =>
    apiRequest<{ uploadUrl: string; publicUrl: string }>("/v1/media/upload-url", {
      method: "POST",
      body: { mimeType, folder },
    }),
};

/** Requests a pre-signed URL, PUTs the file directly to storage, and returns the public URL — the API process never touches the file bytes. */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  const { uploadUrl, publicUrl } = await mediaApi.createUploadUrl(file.type, folder);
  const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) throw new Error("File upload failed");
  return publicUrl;
}
