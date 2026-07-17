import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { CommunityFeedFilters, CreatePostInput, UserRole } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

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
      if (!startup || startup.ownerId !== authorId) throw new ForbiddenException("Not your startup");
    }

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          startupId: input.startupId,
          type: input.type,
          body: input.body,
          mediaUrls: input.mediaUrls,
          eventStartsAt: input.eventStartsAt ? new Date(input.eventStartsAt) : undefined,
          eventLocation: input.eventLocation,
          eventUrl: input.eventUrl,
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
          pollOptions: { include: { votes: true }, orderBy: { order: "asc" } },
          bookmarks: { where: { userId }, select: { id: true } },
          _count: { select: { comments: true, likes: true, rsvps: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const withBookmarkFlag = items.map(({ bookmarks, ...post }) => ({ ...post, isBookmarked: bookmarks.length > 0 }));
    return buildPaginatedResult(withBookmarkFlag, totalItems, filters.page, filters.pageSize);
  }

  async remove(authorId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.authorId !== authorId) throw new ForbiddenException("Not your post");
    return this.prisma.post.delete({ where: { id: postId } });
  }
}
