import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

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

    const existing = await this.prisma.like.findFirst({
      where: { userId, postId: target.postId, commentId: target.commentId },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, postId: target.postId, commentId: target.commentId } });
    return { liked: true };
  }
}
