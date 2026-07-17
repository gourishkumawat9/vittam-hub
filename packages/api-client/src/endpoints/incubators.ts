import type { IncubatorProfileRecord, IncubatorSearchFilters, PaginatedResult } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface IncubatorProgramRecord {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number | null;
  applicationCycleStart: string | null;
  applicationCycleEnd: string | null;
  applicationUrl: string | null;
  eligibilityCriteria: string | null;
}

/** `GET /v1/incubators` and `/v1/incubators/:id` both join in the incubator's programs. */
export interface IncubatorWithPrograms extends IncubatorProfileRecord {
  programs: IncubatorProgramRecord[];
}

export const incubatorsApi = {
  list: (filters: IncubatorSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<IncubatorWithPrograms>>(`/v1/incubators?${params.toString()}`);
  },
  getById: (id: string) => apiRequest<IncubatorWithPrograms>(`/v1/incubators/${id}`),
};
