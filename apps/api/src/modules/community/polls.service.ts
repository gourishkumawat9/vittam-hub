import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

import { findVisiblePost } from "./community-visibility";

/**
 * One vote per user per poll. The database only knows "one vote per option",
 * so the per-poll rule is kept here: the check and the insert run under a
 * lock for that person and poll. Unlocked, two votes sent together for two
 * different options both passed the check.
 */
@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async vote(userId: string, pollOptionId: string) {
    const option = await this.prisma.pollOption.findUnique({ where: { id: pollOptionId } });
    if (!option) throw new NotFoundException("Poll option not found");
    await findVisiblePost(this.prisma, option.postId, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-vote:${userId}:${option.postId}`}))`;

      const existingVoteInPoll = await tx.pollVote.findFirst({
        where: { userId, pollOption: { postId: option.postId } },
      });
      if (existingVoteInPoll) throw new ConflictException("You've already voted in this poll");

      return tx.pollVote.create({ data: { userId, pollOptionId } });
    });
  }
}
