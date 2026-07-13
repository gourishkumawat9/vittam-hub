import { z } from "zod";

import { SubscriptionPlan } from "./enums";

/**
 * Admin-configurable quota per plan — a missing row means "use the hardcoded
 * default" (see PlanLimitsService), which is why `updatedAt` is nullable:
 * null means this plan has never been explicitly configured yet.
 */
export const planLimitSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  monthlyConnectRequestLimit: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().datetime().nullable(),
});
export type PlanLimit = z.infer<typeof planLimitSchema>;

export const updatePlanLimitInputSchema = z.object({
  monthlyConnectRequestLimit: z.coerce.number().int().nonnegative().nullable(),
});
export type UpdatePlanLimitInput = z.infer<typeof updatePlanLimitInputSchema>;
