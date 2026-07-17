import { z } from "zod";

/**
 * Real, auditable signals computed from Connection history — never a
 * black-box score. `responseRate`/`avgResponseTimeHours` are `null` (not 0)
 * when the investor has never received/responded to a request, so the UI
 * can distinguish "no data yet" from "responds to nothing."
 */
export const investorMetricsSchema = z.object({
  responseRate: z.number().min(0).max(1).nullable(),
  avgResponseTimeHours: z.number().nonnegative().nullable(),
  isActive: z.boolean(),
});
export type InvestorMetrics = z.infer<typeof investorMetricsSchema>;
