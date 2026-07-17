"use client";

import { useCurrentUser, useFollowUser, useIsFollowing, useUnfollowUser } from "@vittamhub/api-client";
import { Button } from "@vittamhub/ui";
import { UserCheck, UserPlus } from "lucide-react";

export function FollowButton({ userId }: { userId: string }) {
  const { data: currentUser } = useCurrentUser();
  const { data } = useIsFollowing(userId);
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  if (!currentUser || currentUser.id === userId) return null;

  const isFollowing = data?.isFollowing ?? false;

  return (
    <Button
      size="sm"
      variant={isFollowing ? "secondary" : "primary"}
      isLoading={follow.isPending || unfollow.isPending}
      onClick={() => (isFollowing ? unfollow.mutate(userId) : follow.mutate(userId))}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-3.5 w-3.5" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" /> Follow
        </>
      )}
    </Button>
  );
}
