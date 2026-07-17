import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateCommentInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(authorId: string, postId: string, input: CreateCommentInput) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Post not found");

    const comment = await this.prisma.comment.create({ data: { postId, authorId, body: input.body } });

    if (post.authorId !== authorId) {
      const commenter = await this.prisma.user.findUniqueOrThrow({ where: { id: authorId } });
      this.eventEmitter.emit("post.commented", { userId: post.authorId, commenterName: commenter.fullName, postId });
    }

    return comment;
  }

  list(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }
}
