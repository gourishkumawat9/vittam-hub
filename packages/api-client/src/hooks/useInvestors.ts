"use client";

import type { InvestorSearchFilters, UpdateInvestorInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { investorsApi } from "../endpoints/investors";

export const investorKeys = {
  all: ["investors"] as const,
  list: (filters: InvestorSearchFilters) => [...investorKeys.all, filters] as const,
  detail: (id: string) => ["investors", id] as const,
  mine: ["investors", "me"] as const,
};

export function useInvestors(filters: InvestorSearchFilters) {
  return useQuery({ queryKey: investorKeys.list(filters), queryFn: () => investorsApi.list(filters) });
}

export function useInvestor(id: string) {
  return useQuery({ queryKey: investorKeys.detail(id), queryFn: () => investorsApi.getById(id), enabled: !!id });
}

export function useMyInvestorProfile() {
  return useQuery({ queryKey: investorKeys.mine, queryFn: investorsApi.getMine, retry: false });
}

export function useUpdateMyInvestorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInvestorInput) => investorsApi.updateMine(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: investorKeys.mine }),
  });
}
