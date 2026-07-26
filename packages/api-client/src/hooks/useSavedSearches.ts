"use client";

import type { CreateSavedSearchInput, UpdateSavedSearchInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedSearchesApi } from "../endpoints/saved-searches";

const savedSearchKeys = {
  all: ["saved-searches"] as const,
  run: (id: string) => ["saved-searches", id, "run"] as const,
  newCount: (id: string) => ["saved-searches", id, "new-count"] as const,
};

/** "Every search automatically updates" — re-running is just replaying the stored filters through live discovery. */
export function useSavedSearches() {
  return useQuery({ queryKey: savedSearchKeys.all, queryFn: savedSearchesApi.list });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavedSearchInput) => savedSearchesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSavedSearchInput }) => savedSearchesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useRemoveSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedSearchesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useRunSavedSearch(id: string) {
  return useQuery({ queryKey: savedSearchKeys.run(id), queryFn: () => savedSearchesApi.run(id), enabled: !!id });
}

export function useNewMatchesCount(id: string) {
  return useQuery({ queryKey: savedSearchKeys.newCount(id), queryFn: () => savedSearchesApi.newMatchesCount(id), enabled: !!id });
}

export function useMarkSavedSearchViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedSearchesApi.markViewed(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.newCount(id) });
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.all });
    },
  });
}
