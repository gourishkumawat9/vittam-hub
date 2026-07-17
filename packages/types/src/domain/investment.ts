import { z } from "zod";

/** A portfolio holding — live stage/revenue/team-size are read off the Startup relation, not duplicated here. */
export const investmentSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  startupId: z.string().uuid(),
  investedAt: z.string().datetime(),
  amountUsd: z.number().nonnegative().nullable(),
  notes: z.string().max(2000).nullable(),
  createdAt: z.string().datetime(),
});
export type Investment = z.infer<typeof investmentSchema>;
