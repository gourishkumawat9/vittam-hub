import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { inSameSandbox } from "../../common/demo/demo-scope";
import { PrismaService } from "../../database/prisma/prisma.service";

/** Generic user-to-user follow — separate from StartupFollow (investor→startup watchlist). */
/** The most rows a follower / following list returns in one go. */
const MAX_LISTED = 500;

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException("You cannot follow yourself");

    const following = await this.prisma.user.findUnique({ where: { id: followingId } });
    // Demo and real accounts never interact (common/demo/demo-scope.ts).
    if (!following || following.deletedAt || !(await inSameSandbox(this.prisma, followerId, followingId))) {
      throw new NotFoundException("User not found");
    }

    const where = { followerId_followingId: { followerId, followingId } };
    const existing = await this.prisma.follow.findUnique({ where });
    if (existing) return existing;

    const record = await this.prisma.follow.upsert({ where, create: { followerId, followingId }, update: {} });

    // Only a new follow is news. Tapping "Follow" on someone already followed used to notify them again each time.
    const follower = await this.prisma.user.findUnique({ where: { id: followerId }, select: { fullName: true } });
    this.eventEmitter.emit("user.followed", { followingId, followerName: follower?.fullName ?? "Someone" });
    return record;
  }

  unfollow(followerId: string, followingId: string) {
    return this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  async isFollowing(followerId: string, followingId: string) {
    const record = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { isFollowing: !!record };
  }

  listFollowing(followerId: string) {
    return this.prisma.follow.findMany({
      where: { followerId },
      orderBy: { createdAt: "desc" },
      take: MAX_LISTED,
      include: { following: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
  }

  listFollowers(followingId: string) {
    return this.prisma.follow.findMany({
      where: { followingId },
      orderBy: { createdAt: "desc" },
      take: MAX_LISTED,
      include: { follower: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
  }

  async followerCount(followingId: string) {
    return this.prisma.follow.count({ where: { followingId } });
  }
}
