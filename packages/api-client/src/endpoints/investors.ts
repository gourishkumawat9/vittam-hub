import type { Investor, InvestorMetrics, InvestorSearchFilters, PaginatedResult, UpdateInvestorInput } from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/investors` joins in the owner's public name/avatar, plus real response-rate/time/active-status metrics computed from Connection history. */
export interface InvestorWithOwner extends Investor {
  owner: { fullName: string; avatarUrl: string | null };
  metrics: InvestorMetrics | null;
}

export interface InvestorWithMetrics extends Investor {
  metrics: InvestorMetrics | null;
}

export const investorsApi = {
  list: (filters: InvestorSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    const query = params.toString();
    return apiRequest<PaginatedResult<InvestorWithOwner>>(`/v1/investors${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiRequest<InvestorWithMetrics>(`/v1/investors/${id}`),
  getMine: () => apiRequest<InvestorWithMetrics>("/v1/investors/me"),
  updateMine: (input: UpdateInvestorInput) => apiRequest<Investor>("/v1/investors/me", { method: "PATCH", body: input }),
};
