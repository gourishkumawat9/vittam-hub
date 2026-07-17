import type { Follow, UserRole } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface FollowPersonRef {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface FollowWithFollowing extends Follow {
  following: FollowPersonRef;
}

export interface FollowWithFollower extends Follow {
  follower: FollowPersonRef;
}

export const followsApi = {
  listFollowing: () => apiRequest<FollowWithFollowing[]>("/v1/follows/me"),
  listFollowers: () => apiRequest<FollowWithFollower[]>("/v1/follows/me/followers"),
  isFollowing: (userId: string) => apiRequest<{ isFollowing: boolean }>(`/v1/follows/${userId}`),
  follow: (userId: string) => apiRequest<Follow>(`/v1/follows/${userId}`, { method: "POST" }),
  unfollow: (userId: string) => apiRequest<void>(`/v1/follows/${userId}`, { method: "DELETE" }),
};
