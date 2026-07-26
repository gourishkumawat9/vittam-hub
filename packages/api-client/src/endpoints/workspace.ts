import type { InvestmentMandate, Notification } from "@vittamhub/types";

import { apiRequest } from "../http";

import type { MandateMatch } from "./mandates";

/** GET /v1/workspace/home — the single composed call for the Investor Workspace landing screen. Every field is read from the same service its dedicated page uses. */
export interface WorkspaceHome {
  header: {
    investorName: string;
    trustScore: number | null;
    trustBand: string | null;
    responseRate: number | null;
    avgResponseTimeHours: number | null;
    currentlyDeployingCapital: boolean;
    openMandatesCount: number;
    unreadNotifications: number;
  };
  pipelineSummary: { total: number; byStage: Record<string, number> };
  bestMatchesToday: MandateMatch[];
  watchlist: { count: number; activeTriggers: number };
  savedSearchCount: number;
  activeMandates: InvestmentMandate[];
  recentAlerts: Notification[];
}

export const workspaceApi = {
  home: () => apiRequest<WorkspaceHome>("/v1/workspace/home"),
};
