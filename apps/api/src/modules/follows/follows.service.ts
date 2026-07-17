import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Generic user-to-user follow — separate from StartupFollow (investor→startup watchlist). */
@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException("You cannot follow yourself");

    const following = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!following) throw new NotFoundException("User not found");

    const follower = await this.prisma.user.findUnique({ where: { id: followerId } });

    const record = await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

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
      include: { following: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
  }

  listFollowers(followingId: string) {
    return this.prisma.follow.findMany({
      where: { followingId },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
  }

  async followerCount(followingId: string) {
    return this.prisma.follow.count({ where: { followingId } });
  }
}
