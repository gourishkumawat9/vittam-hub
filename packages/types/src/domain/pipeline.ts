import { z } from "zod";

import { PassReason, PipelineStage } from "./enums";

/** One Kanban card — see PipelineService for the stage-transition rules (reaching CLOSED creates an Investment row; PASSED requires a structured reason). */
export const pipelineEntrySchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  mandateId: z.string().uuid().nullable(),
  stage: z.nativeEnum(PipelineStage),
  notes: z.string().max(2000).nullable(),
  passReason: z.nativeEnum(PassReason).nullable(),
  passNote: z.string().max(1000).nullable(),
  passedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PipelineEntry = z.infer<typeof pipelineEntrySchema>;

export const addToPipelineInputSchema = z.object({
  startupId: z.string().uuid(),
  stage: z.nativeEnum(PipelineStage).default(PipelineStage.SOURCED),
  mandateId: z.string().uuid().optional(),
});
export type AddToPipelineInput = z.infer<typeof addToPipelineInputSchema>;

export const updatePipelineEntryInputSchema = z.object({
  stage: z.nativeEnum(PipelineStage).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdatePipelineEntryInput = z.infer<typeof updatePipelineEntryInputSchema>;

/** "NEVER simply record Passed — require a structured reason" (Investor Workspace §7). */
export const passStartupInputSchema = z.object({
  reason: z.nativeEnum(PassReason),
  note: z.string().max(1000).optional(),
});
export type PassStartupInput = z.infer<typeof passStartupInputSchema>;
