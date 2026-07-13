import type { PlanLimit, SubscriptionPlan, UpdatePlanLimitInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export const planLimitsApi = {
  list: () => apiRequest<PlanLimit[]>("/v1/admin/plan-limits"),
  update: (plan: SubscriptionPlan, input: UpdatePlanLimitInput) =>
    apiRequest<PlanLimit>(`/v1/admin/plan-limits/${plan}`, { method: "PATCH", body: input }),
};
