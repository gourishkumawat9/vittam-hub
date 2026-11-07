import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type {
  CreateDiscussionInput,
  CreateDiscussionReplyInput,
  DiscussionListFilters,
  MarkSolutionInput,
  UserRole,
} from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

import { voteDelta } from "./vote-delta";

const AUTHOR_SELECT = { id: true, fullName: true, avatarUrl: true, role: true } as const;

/** Replies per thread are capped so a runaway thread can't turn into an unbounded read. */
const MAX_REPLIES = 200;

type VoteValue = -1 | 0 | 1;

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(userId: string, filters: DiscussionListFilters) {
    const where: Prisma.DiscussionWhereInput = {
      ...(filters.industry ? { industry: filters.industry } : {}),
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
      ...(filters.sort === "unsolved" ? { kind: "QUESTION", solutionReplyId: null } : {}),
    };

    if (filters.joined && !filters.industry) {
      const memberships = await this.prisma.communityMembership.findMany({ where: { userId }, select: { industry: true } });
      where.industry = { in: memberships.map((row) => row.industry) };
    }

    const orderBy: Prisma.DiscussionOrderByWithRelationInput[] =
      filters.sort === "new"
        ? [{ createdAt: "desc" }]
        : filters.sort === "top"
          ? [{ score: "desc" }, { createdAt: "desc" }]
          : [{ lastActivityAt: "desc" }];

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          author: { select: AUTHOR_SELECT },
          votes: { where: { userId }, select: { value: true } },
        },
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map(({ votes, body, ...discussion }) => ({
        ...discussion,
        excerpt: body.length > 280 ? `${body.slice(0, 280).trimEnd()}…` : body,
        myVote: votes[0]?.value ?? 0,
        isSolved: discussion.solutionReplyId !== null,
      })),
      totalItems,
      filters.page,
      filters.pageSize,
    );
  }

  async get(userId: string, id: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: AUTHOR_SELECT },
        votes: { where: { userId }, select: { value: true } },
        replies: {
          orderBy: [{ score: "desc" }, { createdAt: "asc" }],
          take: MAX_REPLIES,
          include: {
            author: { select: AUTHOR_SELECT },
            votes: { where: { userId }, select: { value: true } },
          },
        },
      },
    });
    if (!discussion) throw new NotFoundException("Discussion not found");

    const { votes, replies, ...rest } = discussion;
    const shaped = replies.map(({ votes: replyVotes, ...reply }) => ({
      ...reply,
      myVote: replyVotes[0]?.value ?? 0,
      isSolution: reply.id === discussion.solutionReplyId,
    }));

    // The accepted solution is pinned first, the way Q&A sites show it.
    shaped.sort((a, b) => Number(b.isSolution) - Number(a.isSolution));

    return { ...rest, myVote: votes[0]?.value ?? 0, isSolved: rest.solutionReplyId !== null, replies: shaped };
  }

  async create(authorId: string, input: CreateDiscussionInput) {
    // Posting in a community makes you a member of it, so its threads show up in your "joined" feed.
    const [discussion] = await this.prisma.$transaction([
      this.prisma.discussion.create({
        data: { authorId, industry: input.industry, kind: input.kind, title: input.title, body: input.body },
      }),
      this.prisma.communityMembership.upsert({
        where: { userId_industry: { userId: authorId, industry: input.industry } },
        create: { userId: authorId, industry: input.industry },
        update: {},
      }),
    ]);
    return discussion;
  }

  async remove(user: { sub: string; role: UserRole }, id: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id }, select: { authorId: true } });
    if (!discussion) throw new NotFoundException("Discussion not found");
    if (discussion.authorId !== user.sub && user.role !== "ADMIN") throw new ForbiddenException("Not your discussion");
    await this.prisma.discussion.delete({ where: { id } });
  }

  async reply(authorId: string, discussionId: string, input: CreateDiscussionReplyInput) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId }, select: { authorId: true, title: true } });
    if (!discussion) throw new NotFoundException("Discussion not found");

    const [reply] = await this.prisma.$transaction([
      this.prisma.discussionReply.create({ data: { discussionId, authorId, body: input.body } }),
      this.prisma.discussion.update({
        where: { id: discussionId },
        data: { replyCount: { increment: 1 }, lastActivityAt: new Date() },
      }),
    ]);

    if (discussion.authorId !== authorId) {
      const replier = await this.prisma.user.findUniqueOrThrow({ where: { id: authorId }, select: { fullName: true } });
      this.eventEmitter.emit("discussion.replied", {
        userId: discussion.authorId,
        replierName: replier.fullName,
        discussionId,
        title: discussion.title,
      });
    }

    return reply;
  }

  async removeReply(user: { sub: string; role: UserRole }, replyId: string) {
    const reply = await this.prisma.discussionReply.findUnique({ where: { id: replyId }, select: { authorId: true, discussionId: true } });
    if (!reply) throw new NotFoundException("Reply not found");
    if (reply.authorId !== user.sub && user.role !== "ADMIN") throw new ForbiddenException("Not your reply");

    // Deleting the accepted answer clears solutionReplyId via ON DELETE SET NULL.
    await this.prisma.$transaction([
      this.prisma.discussionReply.delete({ where: { id: replyId } }),
      this.prisma.discussion.update({ where: { id: reply.discussionId }, data: { replyCount: { decrement: 1 } } }),
    ]);
  }

  /** Only the person who asked can accept an answer, and it must be a reply in their own thread. */
  async markSolution(userId: string, discussionId: string, input: MarkSolutionInput) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId }, select: { authorId: true, title: true } });
    if (!discussion) throw new NotFoundException("Discussion not found");
    if (discussion.authorId !== userId) throw new ForbiddenException("Only the author can mark a solution");

    let replyAuthorId: string | null = null;
    if (input.replyId) {
      const reply = await this.prisma.discussionReply.findUnique({ where: { id: input.replyId }, select: { discussionId: true, authorId: true } });
      if (!reply || reply.discussionId !== discussionId) throw new BadRequestException("That reply isn't part of this discussion");
      replyAuthorId = reply.authorId;
    }

    await this.prisma.discussion.update({ where: { id: discussionId }, data: { solutionReplyId: input.replyId } });

    if (replyAuthorId && replyAuthorId !== userId) {
      this.eventEmitter.emit("discussion.solution-marked", { userId: replyAuthorId, discussionId, title: discussion.title });
    }

    return { solutionReplyId: input.replyId };
  }

  voteOnDiscussion(userId: string, discussionId: string, value: VoteValue) {
    return this.vote(userId, { discussionId }, value);
  }

  voteOnReply(userId: string, replyId: string, value: VoteValue) {
    return this.vote(userId, { replyId }, value);
  }

  /**
   * Upsert/delete the caller's vote and move the denormalised score by the
   * difference, in one transaction so the counter can't drift from the rows.
   */
  private async vote(userId: string, target: { discussionId: string } | { replyId: string }, value: VoteValue) {
    return this.prisma.$transaction(async (tx) => {
      const isDiscussion = "discussionId" in target;

      const exists = isDiscussion
        ? await tx.discussion.findUnique({ where: { id: target.discussionId }, select: { authorId: true } })
        : await tx.discussionReply.findUnique({ where: { id: target.replyId }, select: { authorId: true } });
      if (!exists) throw new NotFoundException(isDiscussion ? "Discussion not found" : "Reply not found");
      if (exists.authorId === userId) throw new BadRequestException("You can't vote on your own post");

      const where = isDiscussion
        ? { userId_discussionId: { userId, discussionId: target.discussionId } }
        : { userId_replyId: { userId, replyId: target.replyId } };

      const existing = await tx.discussionVote.findUnique({ where, select: { value: true } });
      const previous = (existing?.value ?? 0) as VoteValue;
      const delta = voteDelta(previous, value);

      if (value === 0) {
        if (existing) await tx.discussionVote.delete({ where });
      } else {
        await tx.discussionVote.upsert({ where, create: { userId, ...target, value }, update: { value } });
      }

      const updated =
        delta === 0
          ? null
          : isDiscussion
            ? await tx.discussion.update({ where: { id: target.discussionId }, data: { score: { increment: delta } }, select: { score: true } })
            : await tx.discussionReply.update({ where: { id: target.replyId }, data: { score: { increment: delta } }, select: { score: true } });

      return { myVote: value, score: updated?.score ?? null };
    });
  }
}
