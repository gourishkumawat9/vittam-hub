"use client";

import type { FollowStartupInput, UpdateWatchlistEntryInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { watchlistApi } from "../endpoints/watchlist";

const watchlistKeys = { all: ["watchlist"] as const };

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
