"use client";

import type { StartupSearchFilters } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { startupsApi } from "../endpoints/startups";

export const startupKeys = {
  all: ["startups"] as const,
  search: (filters: StartupSearchFilters) => [...startupKeys.all, "search", filters] as const,
  detail: (slug: string) => [...startupKeys.all, "detail", slug] as const,
  mine: ["startups", "me"] as const,
  myHealth: ["startups", "me", "health"] as const,
  milestones: (slug: string) => [...startupKeys.all, "detail", slug, "milestones"] as const,
  myActivity: ["startups", "me", "activity"] as const,
  publicActivity: (slug: string) => [...startupKeys.all, "detail", slug, "activity"] as const,
  myViews: ["startups", "me", "views"] as const,
  myAnalytics: ["startups", "me", "analytics"] as const,
};

export function useStartupSearch(filters: StartupSearchFilters) {
  return useQuery({
    queryKey: startupKeys.search(filters),
    queryFn: () => startupsApi.search(filters),
    placeholderData: (previousData) => previousData, // keeps prior page visible during pagination fetches
  });
}

export function useStartup(slug: string) {
  return useQuery({
    queryKey: startupKeys.detail(slug),
    queryFn: () => startupsApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useMyStartup() {
  return useQuery({ queryKey: startupKeys.mine, queryFn: startupsApi.getMine, retry: false });
}

export function useMyStartupHealth() {
  return useQuery({ queryKey: startupKeys.myHealth, queryFn: startupsApi.getMyHealth, retry: false });
}

export function useMyStartupAnalytics() {
  return useQuery({ queryKey: startupKeys.myAnalytics, queryFn: startupsApi.getMyAnalytics, retry: false });
}

export function useStartupMilestones(slug: string) {
  return useQuery({
    queryKey: startupKeys.milestones(slug),
    queryFn: () => startupsApi.listMilestones(slug),
    enabled: !!slug,
  });
}

export function useAddMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startupsApi.addMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: startupKeys.mine });
      queryClient.invalidateQueries({ queryKey: startupKeys.myHealth });
      queryClient.invalidateQueries({ queryKey: startupKeys.all });
    },
  });
}

export function useCreateStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startupsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: startupKeys.all }),
  });
}

export function useMyFounderActivity() {
  return useQuery({ queryKey: startupKeys.myActivity, queryFn: startupsApi.getMyActivity, retry: false });
}

export function usePublicFounderActivity(slug: string) {
  return useQuery({
    queryKey: startupKeys.publicActivity(slug),
    queryFn: () => startupsApi.getPublicActivity(slug),
    enabled: !!slug,
  });
}

export function useMyStartupProfileViews() {
  return useQuery({ queryKey: startupKeys.myViews, queryFn: startupsApi.getMyProfileViews, retry: false });
}

/** Fire-and-forget — records that the caller viewed this startup's profile. Silently no-ops (via retry:false, no error surfaced) if the caller isn't an investor, since the backend 403s for any other role. */
export function useRecordProfileView() {
  return useMutation({ mutationFn: startupsApi.recordView, retry: false });
}
