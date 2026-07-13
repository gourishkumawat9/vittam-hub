"use client";

import type { SubscriptionPlan, UpdatePlanLimitInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { planLimitsApi } from "../endpoints/plan-limits";

const planLimitKeys = { all: ["plan-limits"] as const };

export function usePlanLimits() {
  return useQuery({ queryKey: planLimitKeys.all, queryFn: planLimitsApi.list });
}

export function useUpdatePlanLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, input }: { plan: SubscriptionPlan; input: UpdatePlanLimitInput }) =>
      planLimitsApi.update(plan, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planLimitKeys.all }),
  });
}
