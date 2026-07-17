import { z } from "zod";

import { PipelineStage } from "./enums";

/** One Kanban card — see PipelineService for the stage-transition rules (moving to INVESTED creates an Investment row). */
export const pipelineEntrySchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  stage: z.nativeEnum(PipelineStage),
  notes: z.string().max(2000).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PipelineEntry = z.infer<typeof pipelineEntrySchema>;

export const addToPipelineInputSchema = z.object({
  startupId: z.string().uuid(),
  stage: z.nativeEnum(PipelineStage).default(PipelineStage.TARGET),
});
export type AddToPipelineInput = z.infer<typeof addToPipelineInputSchema>;

export const updatePipelineEntryInputSchema = z.object({
  stage: z.nativeEnum(PipelineStage).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdatePipelineEntryInput = z.infer<typeof updatePipelineEntryInputSchema>;
