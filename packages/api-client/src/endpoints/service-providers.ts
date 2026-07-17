import type { PaginatedResult, ServiceProviderProfileRecord, ServiceProviderSearchFilters } from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/service-providers` joins in the owner's public name/avatar for card display. */
export interface ServiceProviderWithOwner extends ServiceProviderProfileRecord {
  owner: { fullName: string; avatarUrl: string | null };
}

export const serviceProvidersApi = {
  list: (filters: ServiceProviderSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<ServiceProviderWithOwner>>(`/v1/service-providers?${params.toString()}`);
  },
  getById: (id: string) => apiRequest<ServiceProviderWithOwner>(`/v1/service-providers/${id}`),
};
