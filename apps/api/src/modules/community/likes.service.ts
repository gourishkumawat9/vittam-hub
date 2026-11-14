import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { isDemoViewer } from "../../common/demo/demo-scope";
import { PrismaService } from "../../database/prisma/prisma.service";

import { findVisiblePost } from "./community-visibility";

/** Toggle-style like/unlike. Service layer enforces exactly one of postId/commentId, not a DB CHECK constraint. */
@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, target: { postId?: string; commentId?: string }) {
    const hasPost = !!target.postId;
    const hasComment = !!target.commentId;
    if (hasPost === hasComment) {
      throw new BadRequestException("Provide exactly one of postId or commentId");
    }

    // The target has to exist and be on the caller's side of the demo wall.
    // An id that matched nothing used to reach the database and come back as a 500.
    if (target.postId) {
      await findVisiblePost(this.prisma, target.postId, userId);
    } else {
      const [comment, viewerIsDemo] = await Promise.all([
        this.prisma.comment.findUnique({
          where: { id: target.commentId },
          include: { post: { select: { author: { select: { isDemo: true } } } } },
        }),
        isDemoViewer(this.prisma, userId),
      ]);
      if (!comment || comment.post.author.isDemo !== viewerIsDemo) throw new NotFoundException("Comment not found");
    }

    const where = { userId, postId: target.postId ?? null, commentId: target.commentId ?? null };
    const removed = await this.prisma.like.deleteMany({ where });
    if (removed.count > 0) return { liked: false };

    try {
      await this.prisma.like.create({ data: where });
    } catch (error) {
      // A double-tap sends two requests; the second finds the like already there.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
    return { liked: true };
  }
}
