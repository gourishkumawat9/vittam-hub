import { z } from "zod";

import { ConnectionStatus } from "./enums";

/**
 * The Smart Connect Request — the only channel a founder has to reach an
 * investor (no direct messaging). `startupId` is always the requester's own
 * startup, derived server-side, never client-supplied. See
 * docs/12-connect-requests.md.
 */
export const connectionSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  recipientId: z.string().uuid(),
  startupId: z.string().uuid().nullable(),
  status: z.nativeEnum(ConnectionStatus),
  introduction: z.string().max(1000).nullable(),
  fundingRequirementUsd: z.number().nonnegative().nullable(),
  pitchDeckUrl: z.string().url().nullable(),
  executiveSummaryUrl: z.string().url().nullable(),
  demoLinkUrl: z.string().url().nullable(),
  infoRequestedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  respondedAt: z.string().datetime().nullable(),
});
export type Connection = z.infer<typeof connectionSchema>;

export const createConnectionInputSchema = z.object({
  recipientId: z.string().uuid(),
  introduction: z.string().min(1, "Add a short introduction").max(1000),
  fundingRequirementUsd: z.coerce.number().nonnegative().optional(),
  pitchDeckUrl: z.string().url().optional(),
  executiveSummaryUrl: z.string().url().optional(),
  demoLinkUrl: z.string().url().optional(),
});
export type CreateConnectionInput = z.infer<typeof createConnectionInputSchema>;

/** The investor's three possible responses to a pending connect request. */
export const connectionResponseAction = z.enum(["ACCEPT", "DECLINE", "IGNORE"]);
export type ConnectionResponseAction = z.infer<typeof connectionResponseAction>;

export const respondToConnectionInputSchema = z.object({
  action: connectionResponseAction,
});
export type RespondToConnectionInput = z.infer<typeof respondToConnectionInputSchema>;

export const connectionListFiltersSchema = z.object({
  status: z.array(z.nativeEnum(ConnectionStatus)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ConnectionListFilters = z.infer<typeof connectionListFiltersSchema>;
