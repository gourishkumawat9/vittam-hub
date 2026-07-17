"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { followsApi } from "../endpoints/follows";

const followKeys = {
  following: ["follows", "following"] as const,
  followers: ["follows", "followers"] as const,
  isFollowing: (userId: string) => ["follows", "is-following", userId] as const,
};

export function useFollowing() {
  return useQuery({ queryKey: followKeys.following, queryFn: followsApi.listFollowing });
}

export function useFollowers() {
  return useQuery({ queryKey: followKeys.followers, queryFn: followsApi.listFollowers });
}

export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: followKeys.isFollowing(userId),
    queryFn: () => followsApi.isFollowing(userId),
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followsApi.follow(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: followKeys.following });
      queryClient.invalidateQueries({ queryKey: followKeys.isFollowing(userId) });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followsApi.unfollow(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: followKeys.following });
      queryClient.invalidateQueries({ queryKey: followKeys.isFollowing(userId) });
    },
  });
}
