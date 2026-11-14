import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

import { findVisiblePost } from "./community-visibility";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saying "I'm going" twice is the same as saying it once. */
  async rsvp(userId: string, postId: string) {
    const post = await findVisiblePost(this.prisma, postId, userId);
    if (post.type !== "EVENT") throw new NotFoundException("Event not found");

    try {
      await this.prisma.eventRsvp.create({ data: { postId, userId } });
    } catch (error) {
      // Only "already there" is fine. Every error used to be reported as that, a database outage included.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
    return { attending: true };
  }

  async cancelRsvp(userId: string, postId: string) {
    await this.prisma.eventRsvp.deleteMany({ where: { postId, userId } });
    return { attending: false };
  }
}
