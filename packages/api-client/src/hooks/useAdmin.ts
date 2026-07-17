"use client";

import type { AdminUserListFilters, SignupsFilters } from "@vittamhub/types";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../endpoints/admin";

const adminKeys = {
  verificationOverview: ["admin", "verification-overview"] as const,
  totals: ["admin", "totals"] as const,
  signups: (filters: SignupsFilters) => ["admin", "signups", filters] as const,
  connectionAcceptanceRate: ["admin", "connection-acceptance-rate"] as const,
  verificationFunnel: ["admin", "verification-funnel"] as const,
  users: (filters: AdminUserListFilters) => ["admin", "users", filters] as const,
};

export function useVerificationOverview() {
  return useQuery({ queryKey: adminKeys.verificationOverview, queryFn: adminApi.verificationOverview });
}

export function usePlatformTotals() {
  return useQuery({ queryKey: adminKeys.totals, queryFn: adminApi.totals });
}

export function useSignups(filters: SignupsFilters) {
  return useQuery({ queryKey: adminKeys.signups(filters), queryFn: () => adminApi.signups(filters) });
}

export function useConnectionAcceptanceRate() {
  return useQuery({ queryKey: adminKeys.connectionAcceptanceRate, queryFn: adminApi.connectionAcceptanceRate });
}

export function useVerificationFunnel() {
  return useQuery({ queryKey: adminKeys.verificationFunnel, queryFn: adminApi.verificationFunnel });
}

export function useAdminUsers(filters: AdminUserListFilters) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => adminApi.listUsers(filters),
    placeholderData: (previousData) => previousData,
  });
}
