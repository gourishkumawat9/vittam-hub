import type { CreateSavedSearchInput, PaginatedResult, SavedSearch, UpdateSavedSearchInput } from "@vittamhub/types";

import { apiRequest } from "../http";

import type { StartupSearchResultItem } from "./startups";

export const savedSearchesApi = {
  list: () => apiRequest<SavedSearch[]>("/v1/investors/me/saved-searches"),
  create: (input: CreateSavedSearchInput) =>
    apiRequest<SavedSearch>("/v1/investors/me/saved-searches", { method: "POST", body: input }),
  update: (id: string, input: UpdateSavedSearchInput) =>
    apiRequest<SavedSearch>(`/v1/investors/me/saved-searches/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/investors/me/saved-searches/${id}`, { method: "DELETE" }),
  run: (id: string) => apiRequest<PaginatedResult<StartupSearchResultItem>>(`/v1/investors/me/saved-searches/${id}/run`),
  newMatchesCount: (id: string) => apiRequest<{ count: number }>(`/v1/investors/me/saved-searches/${id}/new-count`),
  markViewed: (id: string) => apiRequest<SavedSearch>(`/v1/investors/me/saved-searches/${id}/mark-viewed`, { method: "POST" }),
};
