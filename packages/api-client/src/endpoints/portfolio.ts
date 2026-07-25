import type { Investment, Startup } from "@vittamhub/types";

import { apiRequest } from "../http";

interface StartupTractionSummary {
  monthlyRevenueAmount: number | null;
  arrAmount: number | null;
  growthRatePercent: number | null;
}

export interface InvestmentWithStartup extends Investment {
  startup: Startup & { traction: StartupTractionSummary | null };
}

export const portfolioApi = {
  list: () => apiRequest<InvestmentWithStartup[]>("/v1/portfolio"),
};
