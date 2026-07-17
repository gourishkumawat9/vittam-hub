"use client";

import type { GlobalSearchFilters } from "@vittamhub/types";
import { useQuery } from "@tanstack/react-query";

import { searchApi } from "../endpoints/search";

export function useGlobalSearch(filters: GlobalSearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchApi.search(filters),
    enabled: enabled && filters.query.trim().length > 0,
  });
}
