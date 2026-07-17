"use client";

import type { IncubatorSearchFilters } from "@vittamhub/types";
import { useQuery } from "@tanstack/react-query";

import { incubatorsApi } from "../endpoints/incubators";

const incubatorKeys = {
  all: ["incubators"] as const,
  list: (filters: IncubatorSearchFilters) => [...incubatorKeys.all, filters] as const,
  detail: (id: string) => ["incubators", id] as const,
};

export function useIncubators(filters: IncubatorSearchFilters) {
  return useQuery({ queryKey: incubatorKeys.list(filters), queryFn: () => incubatorsApi.list(filters) });
}

export function useIncubator(id: string) {
  return useQuery({ queryKey: incubatorKeys.detail(id), queryFn: () => incubatorsApi.getById(id), enabled: !!id });
}
