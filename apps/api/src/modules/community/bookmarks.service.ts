import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

import { findVisiblePost } from "./community-visibility";

/** Toggle-style bookmark/unbookmark, mirrors LikesService's shape. */
@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, postId: string) {
    await findVisiblePost(this.prisma, postId, userId);

    const removed = await this.prisma.postBookmark.deleteMany({ where: { userId, postId } });
    if (removed.count > 0) return { bookmarked: false };

    try {
      await this.prisma.postBookmark.create({ data: { userId, postId } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
    return { bookmarked: true };
  }
}
