import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Toggle-style bookmark/unbookmark, mirrors LikesService's shape. */
@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, postId: string) {
    const existing = await this.prisma.postBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.postBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await this.prisma.postBookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
  }
}
