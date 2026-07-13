import type { CreateStartupInput, PaginatedResult, Startup, StartupSearchFilters } from "@vittamhub/types";

import { apiRequest } from "../http";

export const startupsApi = {
  search: (filters: StartupSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<Startup>>(`/v1/startups?${params.toString()}`);
  },
  getBySlug: (slug: string) => apiRequest<Startup>(`/v1/startups/${slug}`),
  create: (input: CreateStartupInput) => apiRequest<Startup>("/v1/startups", { method: "POST", body: input }),
  update: (id: string, input: Partial<CreateStartupInput>) =>
    apiRequest<Startup>(`/v1/startups/${id}`, { method: "PATCH", body: input }),
};
