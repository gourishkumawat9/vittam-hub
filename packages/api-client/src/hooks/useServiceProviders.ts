"use client";

import type { ServiceProviderSearchFilters } from "@vittamhub/types";
import { useQuery } from "@tanstack/react-query";

import { serviceProvidersApi } from "../endpoints/service-providers";

const serviceProviderKeys = {
  all: ["service-providers"] as const,
  list: (filters: ServiceProviderSearchFilters) => [...serviceProviderKeys.all, filters] as const,
  detail: (id: string) => ["service-providers", id] as const,
};

export function useServiceProviders(filters: ServiceProviderSearchFilters) {
  return useQuery({ queryKey: serviceProviderKeys.list(filters), queryFn: () => serviceProvidersApi.list(filters) });
}

export function useServiceProvider(id: string) {
  return useQuery({ queryKey: serviceProviderKeys.detail(id), queryFn: () => serviceProvidersApi.getById(id), enabled: !!id });
}
