import type { CreateMandateInput, InvestmentMandate, MatchScoreReason, Startup, UpdateMandateInput } from "@vittamhub/types";

import { apiRequest } from "../http";

/** One item in a mandate's match stream — same deterministic fit score as regular discovery (MatchScoreService), just scored against the mandate's own criteria instead of the investor's default thesis. */
export interface MandateMatch {
  startup: Startup;
  startupId: string;
  score: number;
  reasons: MatchScoreReason[];
}

export const mandatesApi = {
  list: () => apiRequest<InvestmentMandate[]>("/v1/investors/me/mandates"),
  create: (input: CreateMandateInput) => apiRequest<InvestmentMandate>("/v1/investors/me/mandates", { method: "POST", body: input }),
  update: (id: string, input: UpdateMandateInput) =>
    apiRequest<InvestmentMandate>(`/v1/investors/me/mandates/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/investors/me/mandates/${id}`, { method: "DELETE" }),
  matches: (id: string, limit?: number) =>
    apiRequest<MandateMatch[]>(`/v1/investors/me/mandates/${id}/matches${limit ? `?limit=${limit}` : ""}`),
};
