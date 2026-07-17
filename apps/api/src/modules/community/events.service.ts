import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async rsvp(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.type !== "EVENT") throw new NotFoundException("Event not found");

    try {
      return await this.prisma.eventRsvp.create({ data: { postId, userId } });
    } catch {
      throw new ConflictException("You've already RSVP'd to this event");
    }
  }

  async cancelRsvp(userId: string, postId: string) {
    await this.prisma.eventRsvp.deleteMany({ where: { postId, userId } });
    return { cancelled: true };
  }
}
