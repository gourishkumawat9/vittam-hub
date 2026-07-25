"use client";

import type { CreateDocumentGrantInput, DocumentUploadInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { documentsApi } from "../endpoints/documents";

const documentKeys = {
  all: ["documents"] as const,
  sharedWithMe: ["documents", "shared-with-me"] as const,
  grants: (id: string) => ["documents", id, "grants"] as const,
};

export function useDocuments() {
  return useQuery({ queryKey: documentKeys.all, queryFn: documentsApi.list });
}

/** Bundle 21 — documents currently shared with the caller (permissioned data room). */
export function useSharedWithMeDocuments() {
  return useQuery({ queryKey: documentKeys.sharedWithMe, queryFn: documentsApi.sharedWithMe });
}

export function useDocumentGrants(documentId: string) {
  return useQuery({ queryKey: documentKeys.grants(documentId), queryFn: () => documentsApi.listGrants(documentId), enabled: !!documentId });
}

export function useGrantDocumentAccess(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentGrantInput) => documentsApi.grant(documentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.grants(documentId) }),
  });
}

export function useRevokeDocumentGrant(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grantId: string) => documentsApi.revokeGrant(grantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.grants(documentId) }),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentUploadInput) => documentsApi.upload(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
