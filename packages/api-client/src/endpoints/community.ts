import type { CommunityFeedFilters, CreateCommentInput, CreatePostInput, PaginatedResult, PostType } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface PostPersonRef {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface PostStartupRef {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface PollOptionWithVotes {
  id: string;
  postId: string;
  label: string;
  order: number;
  votes: { id: string; userId: string }[];
}

/** `GET /v1/community/feed` joins in the author, startup context, poll tallies, and counts so the feed never needs follow-up fetches per row. */
export interface PostWithRelations {
  id: string;
  authorId: string;
  startupId: string | null;
  type: PostType;
  body: string;
  mediaUrls: string[];
  eventStartsAt: string | null;
  eventLocation: string | null;
  eventUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostPersonRef;
  startup: PostStartupRef | null;
  pollOptions: PollOptionWithVotes[];
  isBookmarked: boolean;
  _count: { comments: number; likes: number; rsvps: number };
}

export interface CommentWithAuthor {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: PostPersonRef;
}

export const communityApi = {
  feed: (filters: CommunityFeedFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<PostWithRelations>>(`/v1/community/feed?${params.toString()}`);
  },
  createPost: (input: CreatePostInput) => apiRequest<PostWithRelations>("/v1/community/posts", { method: "POST", body: input }),
  removePost: (id: string) => apiRequest<void>(`/v1/community/posts/${id}`, { method: "DELETE" }),
  listComments: (postId: string) => apiRequest<CommentWithAuthor[]>(`/v1/community/posts/${postId}/comments`),
  addComment: (postId: string, input: CreateCommentInput) =>
    apiRequest<CommentWithAuthor>(`/v1/community/posts/${postId}/comments`, { method: "POST", body: input }),
  likePost: (postId: string) => apiRequest<{ liked: boolean }>(`/v1/community/posts/${postId}/like`, { method: "POST" }),
  bookmarkPost: (postId: string) => apiRequest<{ bookmarked: boolean }>(`/v1/community/posts/${postId}/bookmark`, { method: "POST" }),
  likeComment: (commentId: string) => apiRequest<{ liked: boolean }>(`/v1/community/comments/${commentId}/like`, { method: "POST" }),
  vote: (pollOptionId: string) => apiRequest(`/v1/community/polls/${pollOptionId}/vote`, { method: "POST" }),
  rsvp: (postId: string) => apiRequest(`/v1/community/posts/${postId}/rsvp`, { method: "POST" }),
  cancelRsvp: (postId: string) => apiRequest(`/v1/community/posts/${postId}/rsvp`, { method: "DELETE" }),
};
