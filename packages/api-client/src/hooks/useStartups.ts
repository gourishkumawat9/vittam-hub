"use client";

import type { StartupSearchFilters } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { startupsApi } from "../endpoints/startups";

export const startupKeys = {
  all: ["startups"] as const,
  search: (filters: StartupSearchFilters) => [...startupKeys.all, "search", filters] as const,
  detail: (slug: string) => [...startupKeys.all, "detail", slug] as const,
};

export function useStartupSearch(filters: StartupSearchFilters) {
  return useQuery({
    queryKey: startupKeys.search(filters),
    queryFn: () => startupsApi.search(filters),
    placeholderData: (previousData) => previousData, // keeps prior page visible during pagination fetches
  });
}

export function useStartup(slug: string) {
  return useQuery({
    queryKey: startupKeys.detail(slug),
    queryFn: () => startupsApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startupsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: startupKeys.all }),
  });
}
