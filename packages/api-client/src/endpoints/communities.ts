import type {
  CastDiscussionVoteInput,
  CreateDiscussionInput,
  CreateDiscussionReplyInput,
  DiscussionKind,
  DiscussionListFilters,
  Industry,
  PaginatedResult,
  UserRole,
} from "@vittamhub/types";

import { apiRequest } from "../http";

export interface CommunitySummary {
  industry: Industry;
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  discussionCount: number;
  isMember: boolean;
}

export interface DiscussionAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface DiscussionListItem {
  id: string;
  industry: Industry;
  authorId: string;
  kind: DiscussionKind;
  title: string;
  excerpt: string;
  score: number;
  replyCount: number;
  solutionReplyId: string | null;
  isSolved: boolean;
  myVote: -1 | 0 | 1;
  lastActivityAt: string;
  createdAt: string;
  author: DiscussionAuthor;
}

export interface DiscussionReplyItem {
  id: string;
  discussionId: string;
  authorId: string;
  body: string;
  score: number;
  myVote: -1 | 0 | 1;
  isSolution: boolean;
  createdAt: string;
  author: DiscussionAuthor;
}

export interface DiscussionDetail extends Omit<DiscussionListItem, "excerpt"> {
  body: string;
  replies: DiscussionReplyItem[];
}

export interface VoteResult {
  myVote: -1 | 0 | 1;
  score: number | null;
}

function toQuery(filters: Partial<DiscussionListFilters>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

export const communitiesApi = {
  list: () => apiRequest<CommunitySummary[]>("/v1/communities"),
  get: (slug: string) => apiRequest<CommunitySummary>(`/v1/communities/${slug}`),
  join: (slug: string) => apiRequest<{ isMember: boolean }>(`/v1/communities/${slug}/join`, { method: "POST" }),
  leave: (slug: string) => apiRequest<{ isMember: boolean }>(`/v1/communities/${slug}/join`, { method: "DELETE" }),

  listDiscussions: (filters: Partial<DiscussionListFilters>) =>
    apiRequest<PaginatedResult<DiscussionListItem>>(`/v1/discussions?${toQuery(filters)}`),
  getDiscussion: (id: string) => apiRequest<DiscussionDetail>(`/v1/discussions/${id}`),
  createDiscussion: (input: CreateDiscussionInput) => apiRequest<{ id: string }>("/v1/discussions", { method: "POST", body: input }),
  removeDiscussion: (id: string) => apiRequest<void>(`/v1/discussions/${id}`, { method: "DELETE" }),
  reply: (discussionId: string, input: CreateDiscussionReplyInput) =>
    apiRequest<{ id: string }>(`/v1/discussions/${discussionId}/replies`, { method: "POST", body: input }),
  removeReply: (replyId: string) => apiRequest<void>(`/v1/discussion-replies/${replyId}`, { method: "DELETE" }),
  markSolution: (discussionId: string, replyId: string | null) =>
    apiRequest<{ solutionReplyId: string | null }>(`/v1/discussions/${discussionId}/solution`, { method: "POST", body: { replyId } }),
  voteDiscussion: (id: string, input: CastDiscussionVoteInput) =>
    apiRequest<VoteResult>(`/v1/discussions/${id}/vote`, { method: "POST", body: input }),
  voteReply: (id: string, input: CastDiscussionVoteInput) =>
    apiRequest<VoteResult>(`/v1/discussion-replies/${id}/vote`, { method: "POST", body: input }),
};
