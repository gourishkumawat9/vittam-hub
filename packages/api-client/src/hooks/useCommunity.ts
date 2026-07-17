"use client";

import type { CommunityFeedFilters, CreateCommentInput, CreatePostInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { communityApi } from "../endpoints/community";

const communityKeys = {
  feed: (filters: CommunityFeedFilters) => ["community", "feed", filters] as const,
  comments: (postId: string) => ["community", "posts", postId, "comments"] as const,
};

export function useCommunityFeed(filters: CommunityFeedFilters) {
  return useQuery({ queryKey: communityKeys.feed(filters), queryFn: () => communityApi.feed(filters) });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => communityApi.createPost(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}

export function useRemovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communityApi.removePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}

export function usePostComments(postId: string) {
  return useQuery({ queryKey: communityKeys.comments(postId), queryFn: () => communityApi.listComments(postId), enabled: !!postId });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => communityApi.addComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityApi.likePost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityApi.bookmarkPost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pollOptionId: string) => communityApi.vote(pollOptionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}

export function useRsvpToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, attending }: { postId: string; attending: boolean }) =>
      attending ? communityApi.rsvp(postId) : communityApi.cancelRsvp(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "feed"] }),
  });
}
