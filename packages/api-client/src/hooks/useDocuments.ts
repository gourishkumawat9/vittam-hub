"use client";

import type { DocumentUploadInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { documentsApi } from "../endpoints/documents";

const documentKeys = { all: ["documents"] as const };

export function useDocuments() {
  return useQuery({ queryKey: documentKeys.all, queryFn: documentsApi.list });
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
