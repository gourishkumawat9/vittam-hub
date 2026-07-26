import { z } from "zod";

import { Currency } from "./enums";

/** A portfolio holding — live stage/revenue/team-size are read off the Startup relation, not duplicated here. */
export const investmentSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  investedAt: z.string().datetime(),
  currency: z.nativeEnum(Currency).default(Currency.INR),
  amount: z.number().nonnegative().nullable(),
  notes: z.string().max(2000).nullable(),
  exitedAt: z.string().datetime().nullable(),
  exitValueAmount: z.number().nonnegative().nullable(),
  nextFollowUpAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Investment = z.infer<typeof investmentSchema>;

/** Investor Workspace §9 — a real exit event, not a valuation estimate. */
export const recordExitInputSchema = z.object({
  exitValueAmount: z.coerce.number().nonnegative().optional(),
});
export type RecordExitInput = z.infer<typeof recordExitInputSchema>;

export const setFollowUpInputSchema = z.object({
  nextFollowUpAt: z.string().datetime().nullable(),
});
export type SetFollowUpInput = z.infer<typeof setFollowUpInputSchema>;
