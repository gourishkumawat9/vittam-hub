import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/** One vote per user per poll — checked by joining through PollOption.postId before insert (app-level invariant, see schema.prisma). */
@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async vote(userId: string, pollOptionId: string) {
    const option = await this.prisma.pollOption.findUnique({ where: { id: pollOptionId } });
    if (!option) throw new NotFoundException("Poll option not found");

    const existingVoteInPoll = await this.prisma.pollVote.findFirst({
      where: { userId, pollOption: { postId: option.postId } },
    });
    if (existingVoteInPoll) throw new ConflictException("You've already voted in this poll");

    return this.prisma.pollVote.create({ data: { userId, pollOptionId } });
  }
}
