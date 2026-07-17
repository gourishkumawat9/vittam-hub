import type { PaginatedResult, UniversityProfileRecord, UniversitySearchFilters } from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/universities` joins in the owner's public name/avatar for card display. */
export interface UniversityWithOwner extends UniversityProfileRecord {
  owner: { fullName: string; avatarUrl: string | null };
}

export const universitiesApi = {
  list: (filters: UniversitySearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<UniversityWithOwner>>(`/v1/universities?${params.toString()}`);
  },
  getById: (id: string) => apiRequest<UniversityWithOwner>(`/v1/universities/${id}`),
};
