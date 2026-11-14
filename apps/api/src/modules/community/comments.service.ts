import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateCommentInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { findVisiblePost } from "./community-visibility";

/** The most comments one request returns. Older ones are still stored; the thread view shows the latest. */
const MAX_COMMENTS = 200;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(authorId: string, postId: string, input: CreateCommentInput) {
    const post = await findVisiblePost(this.prisma, postId, authorId);

    const comment = await this.prisma.comment.create({
      data: { postId, authorId, body: input.body },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    if (post.authorId !== authorId) {
      this.eventEmitter.emit("post.commented", { userId: post.authorId, commenterName: comment.author.fullName, postId });
    }

    return comment;
  }

  async list(postId: string, viewerId: string) {
    await findVisiblePost(this.prisma, postId, viewerId);
    const latest = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      take: MAX_COMMENTS,
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    return latest.reverse(); // oldest first, as a conversation reads
  }
}
