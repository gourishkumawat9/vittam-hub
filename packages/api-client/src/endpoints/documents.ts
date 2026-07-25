import type { CreateDocumentGrantInput, DocumentGrant, DocumentGrantWithViews, DocumentRecord, DocumentUploadInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface SharedDocumentGrant extends DocumentGrant {
  document: { id: string; type: string; fileName: string; userId: string };
}

export const documentsApi = {
  list: () => apiRequest<DocumentRecord[]>("/v1/documents"),
  upload: (input: DocumentUploadInput) => apiRequest<DocumentRecord>("/v1/documents", { method: "POST", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/documents/${id}`, { method: "DELETE" }),
  sharedWithMe: () => apiRequest<SharedDocumentGrant[]>("/v1/documents/shared-with-me"),
  access: (id: string) => apiRequest<{ fileUrl: string; fileName: string; type: string }>(`/v1/documents/${id}/access`),
  listGrants: (id: string) => apiRequest<DocumentGrantWithViews[]>(`/v1/documents/${id}/grants`),
  grant: (id: string, input: CreateDocumentGrantInput) =>
    apiRequest<DocumentGrant>(`/v1/documents/${id}/grants`, { method: "POST", body: input }),
  revokeGrant: (grantId: string) => apiRequest<void>(`/v1/documents/grants/${grantId}`, { method: "DELETE" }),
  acceptNda: (grantId: string) => apiRequest<DocumentGrant>(`/v1/documents/grants/${grantId}/accept-nda`, { method: "POST" }),
};
