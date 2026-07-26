import type { AddToPipelineInput, MatchScore, PassStartupInput, PipelineEntry, Startup, UpdatePipelineEntryInput } from "@vittamhub/types";

import { apiRequest } from "../http";

interface PipelineStartupTraction {
  monthlyRevenueAmount: number | null;
  arrAmount: number | null;
  mrrAmount: number | null;
  totalUsers: number | null;
  growthRatePercent: number | null;
}

interface PipelineStartupFunding {
  currentRaiseAmount: number | null;
  fundingGoalAmount: number | null;
  valuationAmount: number | null;
}

/** Each Kanban card, enriched with the same Trust Score + Match % every other discovery surface computes — see PipelineController.list. */
export interface PipelineEntryWithStartup extends PipelineEntry {
  startup: Startup & { traction: PipelineStartupTraction | null; funding: PipelineStartupFunding | null };
  trustScore: { score: number; band: string };
  matchScore: MatchScore | null;
}

export const pipelineApi = {
  list: () => apiRequest<PipelineEntryWithStartup[]>("/v1/pipeline"),
  add: (input: AddToPipelineInput) => apiRequest<PipelineEntry>("/v1/pipeline", { method: "POST", body: input }),
  update: (id: string, input: UpdatePipelineEntryInput) =>
    apiRequest<PipelineEntry>(`/v1/pipeline/${id}`, { method: "PATCH", body: input }),
  pass: (id: string, input: PassStartupInput) => apiRequest<PipelineEntry>(`/v1/pipeline/${id}/pass`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/pipeline/${id}`, { method: "DELETE" }),
};
