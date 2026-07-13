"use client";

import { useQuery } from "@tanstack/react-query";

import { investorsApi } from "../endpoints/investors";

export const investorKeys = {
  all: ["investors"] as const,
  detail: (id: string) => ["investors", id] as const,
};

export function useInvestors() {
  return useQuery({ queryKey: investorKeys.all, queryFn: investorsApi.list });
}

export function useInvestor(id: string) {
  return useQuery({ queryKey: investorKeys.detail(id), queryFn: () => investorsApi.getById(id), enabled: !!id });
}
