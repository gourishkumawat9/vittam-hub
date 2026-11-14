import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { CommunityFeedFilters, CreatePostInput, UserRole } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { isDemoViewer } from "../../common/demo/demo-scope";
import { PrismaService } from "../../database/prisma/prisma.service";

/** A few minutes of slack for a slow form and a device clock that runs fast. */
const CLOCK_SLACK_MS = 5 * 60_000;

/**
 * One table + a `type` discriminator (FOUNDER_POST/STARTUP_UPDATE/
 * ANNOUNCEMENT/POLL/EVENT) rather than five separate models — see Post's
 * doc comment in schema.prisma. Feed is plain createdAt-desc pagination,
 * consistent with the rest of the app's "no algorithmic ranking" approach.
 */
@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, authorRole: UserRole, input: CreatePostInput) {
    if (input.type === "ANNOUNCEMENT" && authorRole !== "ADMIN") {
      throw new ForbiddenException("Only admins can post announcements");
    }

    if (input.startupId) {
      const startup = await this.prisma.startup.findUnique({ where: { id: input.startupId } });
      if (!startup || startup.deletedAt || startup.ownerId !== authorId) throw new ForbiddenException("Not your startup");
    }
    if (input.type === "STARTUP_UPDATE" && !input.startupId) {
      throw new BadRequestException("A startup update needs your startup profile. Finish setting it up first.");
    }

    if (input.type === "EVENT" && input.eventStartsAt && new Date(input.eventStartsAt).getTime() < Date.now() - CLOCK_SLACK_MS) {
      throw new BadRequestException("Pick a start time in the future");
    }

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          startupId: input.startupId,
          type: input.type,
          body: input.body,
          mediaUrls: input.mediaUrls,
          // Event details are only kept on an event; a plain post can't carry a hidden link.
          eventStartsAt: input.type === "EVENT" && input.eventStartsAt ? new Date(input.eventStartsAt) : undefined,
          eventLocation: input.type === "EVENT" ? input.eventLocation : undefined,
          eventUrl: input.type === "EVENT" ? input.eventUrl : undefined,
        },
      });

      if (input.type === "POLL" && input.pollOptions?.length) {
        await tx.pollOption.createMany({
          data: input.pollOptions.map((label, order) => ({ postId: post.id, label, order })),
        });
      }

      return post;
    });
  }

  async feed(filters: CommunityFeedFilters, userId: string) {
    const where: Prisma.PostWhereInput = {
      // Demo accounts post into their own feed; real users never see demo posts (common/demo/demo-scope.ts).
      author: { isDemo: await isDemoViewer(this.prisma, userId) },
      ...(filters.type?.length ? { type: { in: filters.type } } : {}),
      ...(filters.startupId ? { startupId: filters.startupId } : {}),
      ...(filters.bookmarkedOnly ? { bookmarks: { some: { userId } } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          startup: { select: { id: true, name: true, slug: true, logoUrl: true } },
          pollOptions: {
            orderBy: { order: "asc" },
            // A tally, plus the caller's own vote if any. The full list of
            // votes used to be returned, which told every reader who voted for what.
            include: { _count: { select: { votes: true } }, votes: { where: { userId }, select: { id: true } } },
          },
          bookmarks: { where: { userId }, select: { id: true } },
          likes: { where: { userId }, select: { id: true } },
          rsvps: { where: { userId }, select: { id: true } },
          _count: { select: { comments: true, likes: true, rsvps: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const forViewer = items.map(({ bookmarks, likes, rsvps, pollOptions, ...post }) => ({
      ...post,
      pollOptions: pollOptions.map(({ votes, _count, ...option }) => ({
        ...option,
        voteCount: _count.votes,
        votedByMe: votes.length > 0,
      })),
      isBookmarked: bookmarks.length > 0,
      isLiked: likes.length > 0,
      isAttending: rsvps.length > 0,
    }));
    return buildPaginatedResult(forViewer, totalItems, filters.page, filters.pageSize);
  }

  /** Authors delete their own posts. An admin can take any post down: a public feed needs a way to remove abuse. */
  async remove(callerId: string, callerRole: UserRole, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.authorId !== callerId && callerRole !== "ADMIN") throw new ForbiddenException("Not your post");
    await this.prisma.post.delete({ where: { id: postId } });
    return { deleted: true };
  }
}
