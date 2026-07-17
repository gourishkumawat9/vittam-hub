import type { AddToPipelineInput, PipelineEntry, Startup, UpdatePipelineEntryInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface PipelineEntryWithStartup extends PipelineEntry {
  startup: Startup;
}

export const pipelineApi = {
  list: () => apiRequest<PipelineEntryWithStartup[]>("/v1/pipeline"),
  add: (input: AddToPipelineInput) => apiRequest<PipelineEntry>("/v1/pipeline", { method: "POST", body: input }),
  update: (id: string, input: UpdatePipelineEntryInput) =>
    apiRequest<PipelineEntry>(`/v1/pipeline/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<void>(`/v1/pipeline/${id}`, { method: "DELETE" }),
};
