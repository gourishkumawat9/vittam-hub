import type { Investment, RecordExitInput, SetFollowUpInput, Startup } from "@vittamhub/types";

import { apiRequest } from "../http";

interface StartupTractionSummary {
  monthlyRevenueAmount: number | null;
  arrAmount: number | null;
  growthRatePercent: number | null;
}

export interface InvestmentWithStartup extends Investment {
  startup: Startup & { traction: StartupTractionSummary | null };
}

/** GET /v1/portfolio/dashboard — every number is a real aggregate, "unrealised" is capital still deployed, never a mark-to-market estimate (Investor Workspace §9). */
export interface PortfolioDashboard {
  totalInvestments: number;
  activeInvestments: number;
  exitedInvestments: number;
  unrealisedAmount: number;
  realisedAmount: number;
  averageTrustScore: number | null;
  averageGrowthRatePercent: number | null;
  latestMilestones: { id: string; title: string; type: string; achievedAt: string; startup: { name: string; logoUrl: string | null } }[];
  recentRevenueImprovements: { startupId: string; from: string; to: string }[];
  recentTrustImprovements: { startupId: string; from: number; to: number }[];
  recentVerificationChanges: { id: string; entityId: string; field: string; method: string; verifiedAt: string | null }[];
  upcomingFollowUps: (Investment & { startup: { name: string; logoUrl: string | null } })[];
}

export const portfolioApi = {
  list: () => apiRequest<InvestmentWithStartup[]>("/v1/portfolio"),
  dashboard: () => apiRequest<PortfolioDashboard>("/v1/portfolio/dashboard"),
  recordExit: (startupId: string, input: RecordExitInput) =>
    apiRequest<Investment>(`/v1/portfolio/${startupId}/exit`, { method: "PATCH", body: input }),
  setFollowUp: (startupId: string, input: SetFollowUpInput) =>
    apiRequest<Investment>(`/v1/portfolio/${startupId}/follow-up`, { method: "PATCH", body: input }),
};
