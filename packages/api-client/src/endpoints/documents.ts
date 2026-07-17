import type { DocumentRecord, DocumentUploadInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export const documentsApi = {
  list: () => apiRequest<DocumentRecord[]>("/v1/documents"),
  upload: (input: DocumentUploadInput) => apiRequest<DocumentRecord>("/v1/documents", { method: "POST", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/documents/${id}`, { method: "DELETE" }),
};
