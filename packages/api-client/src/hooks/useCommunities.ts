"use client";

import type { CreateDiscussionInput, CreateDiscussionReplyInput, DiscussionListFilters } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { communitiesApi } from "../endpoints/communities";

const communitiesKeys = {
  all: ["communities"] as const,
  list: () => ["communities", "list"] as const,
  detail: (slug: string) => ["communities", "detail", slug] as const,
  discussions: (filters: Partial<DiscussionListFilters>) => ["communities", "discussions", filters] as const,
  discussion: (id: string) => ["communities", "discussion", id] as const,
};

export function useCommunities() {
  return useQuery({ queryKey: communitiesKeys.list(), queryFn: communitiesApi.list });
}

export function useDomainCommunity(slug: string) {
  return useQuery({ queryKey: communitiesKeys.detail(slug), queryFn: () => communitiesApi.get(slug), enabled: !!slug });
}

export function useToggleCommunityMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, join }: { slug: string; join: boolean }) => (join ? communitiesApi.join(slug) : communitiesApi.leave(slug)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

export function useDiscussions(filters: Partial<DiscussionListFilters>) {
  return useQuery({ queryKey: communitiesKeys.discussions(filters), queryFn: () => communitiesApi.listDiscussions(filters) });
}

export function useDiscussion(id: string) {
  return useQuery({ queryKey: communitiesKeys.discussion(id), queryFn: () => communitiesApi.getDiscussion(id), enabled: !!id });
}

export function useCreateDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiscussionInput) => communitiesApi.createDiscussion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

export function useRemoveDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesApi.removeDiscussion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

export function useReplyToDiscussion(discussionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiscussionReplyInput) => communitiesApi.reply(discussionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

export function useRemoveDiscussionReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => communitiesApi.removeReply(replyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

export function useMarkSolution(discussionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string | null) => communitiesApi.markSolution(discussionId, replyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}

/** Votes refetch on settle; the vote button itself renders the optimistic state, so a click feels instant. */
export function useDiscussionVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ target, id, value }: { target: "discussion" | "reply"; id: string; value: -1 | 0 | 1 }) =>
      target === "discussion" ? communitiesApi.voteDiscussion(id, { value }) : communitiesApi.voteReply(id, { value }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: communitiesKeys.all }),
  });
}
