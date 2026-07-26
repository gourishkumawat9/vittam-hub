"use client";

import type { CreateWatchlistTriggerInput, FollowStartupInput, UpdateWatchlistEntryInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { watchlistApi } from "../endpoints/watchlist";

const watchlistKeys = { all: ["watchlist"] as const, triggers: ["watchlist", "triggers"] as const };

export function useWatchlist() {
  return useQuery({ queryKey: watchlistKeys.all, queryFn: watchlistApi.list });
}

export function useFollowStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FollowStartupInput) => watchlistApi.follow(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });
}

export function useUnfollowStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (startupId: string) => watchlistApi.unfollow(startupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });
}

export function useUpdateWatchlistEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startupId, input }: { startupId: string; input: UpdateWatchlistEntryInput }) =>
      watchlistApi.update(startupId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });
}

/** "Notify when revenue > target / trust score reaches Gold / ..." — evaluated hourly, fires a real Notification. */
export function useWatchlistTriggers() {
  return useQuery({ queryKey: watchlistKeys.triggers, queryFn: watchlistApi.listTriggers });
}

export function useCreateWatchlistTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWatchlistTriggerInput) => watchlistApi.createTrigger(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.triggers }),
  });
}

export function useRemoveWatchlistTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistApi.removeTrigger(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.triggers }),
  });
}
