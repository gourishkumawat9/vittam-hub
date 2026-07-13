import type { Investor } from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/investors` joins in the owner's public name/avatar for card display. */
export interface InvestorWithOwner extends Investor {
  owner: { fullName: string; avatarUrl: string | null };
}

export const investorsApi = {
  list: () => apiRequest<InvestorWithOwner[]>("/v1/investors"),
  getById: (id: string) => apiRequest<Investor>(`/v1/investors/${id}`),
};
