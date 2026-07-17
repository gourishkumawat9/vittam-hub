"use client";

import type { UniversitySearchFilters } from "@vittamhub/types";
import { useQuery } from "@tanstack/react-query";

import { universitiesApi } from "../endpoints/universities";

const universityKeys = {
  all: ["universities"] as const,
  list: (filters: UniversitySearchFilters) => [...universityKeys.all, filters] as const,
  detail: (id: string) => ["universities", id] as const,
};

export function useUniversities(filters: UniversitySearchFilters) {
  return useQuery({ queryKey: universityKeys.list(filters), queryFn: () => universitiesApi.list(filters) });
}

export function useUniversity(id: string) {
  return useQuery({ queryKey: universityKeys.detail(id), queryFn: () => universitiesApi.getById(id), enabled: !!id });
}
