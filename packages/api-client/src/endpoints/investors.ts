import type { Investor, InvestorMetrics, InvestorSearchFilters, PaginatedResult, UpdateInvestorInput } from "@vittamhub/types";

import { apiRequest } from "../http";

/** Investor Trust Score (a simpler, separate model from the startup one — see InvestorTrustService). Score + band only, never the factor breakdown, outside the caller's own profile. */
export interface InvestorTrustSummary {
  score: number;
  band: "STARTING" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
}

/** `GET /v1/investors` joins in the owner's public name/avatar, plus real response-rate/time/active-status metrics computed from Connection history. */
export interface InvestorWithOwner extends Investor {
  owner: { fullName: string; avatarUrl: string | null };
  metrics: InvestorMetrics | null;
  trust: InvestorTrustSummary | null;
}

export interface InvestorWithMetrics extends Investor {
  metrics: InvestorMetrics | null;
  trust: InvestorTrustSummary | null;
}

/** GET /v1/investors/me/co-investors — real shared-investment/confirmed-relationship data, no AI (Investor Workspace §8). */
export interface CoInvestorGraph {
  coInvestors: { investorId: string; fullName: string; avatarUrl: string | null; sharedStartups: { id: string; name: string; logoUrl: string | null }[] }[];
  mutualConfirmations: number;
  syndicatePartners: {
    ownerId: string;
    firmName: string | null;
    investorType: string;
    preferredIndustries: string[];
    preferredStages: string[];
    owner: { fullName: string };
  }[];
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
  getMyCoInvestorGraph: () => apiRequest<CoInvestorGraph>("/v1/investors/me/co-investors"),
};
