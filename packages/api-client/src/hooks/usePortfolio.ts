"use client";

import type { RecordExitInput, SetFollowUpInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { portfolioApi } from "../endpoints/portfolio";

const portfolioKeys = { all: ["portfolio"] as const, dashboard: ["portfolio", "dashboard"] as const };

export function usePortfolio() {
  return useQuery({ queryKey: portfolioKeys.all, queryFn: portfolioApi.list });
}

/** Portfolio dashboard — totals, average trust, recent improvements, upcoming follow-ups. */
export function usePortfolioDashboard() {
  return useQuery({ queryKey: portfolioKeys.dashboard, queryFn: portfolioApi.dashboard, retry: false });
}

export function useRecordExit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startupId, input }: { startupId: string; input: RecordExitInput }) => portfolioApi.recordExit(startupId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.dashboard });
    },
  });
}

export function useSetFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startupId, input }: { startupId: string; input: SetFollowUpInput }) => portfolioApi.setFollowUp(startupId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.dashboard });
    },
  });
}
