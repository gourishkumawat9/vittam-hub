import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { EventEmitter2 } from "@nestjs/event-emitter";

import type { PrismaService } from "../../database/prisma/prisma.service";

import { DiscussionsService } from "./discussions.service";
import { voteDelta } from "./vote-delta";

function setup() {
  const prisma = {
    discussion: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({ score: 1 }) },
    discussionReply: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({ score: 1 }) },
    discussionVote: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    $transaction: jest.fn(),
  };
  // Interactive transactions run against the same mock client.
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  const eventEmitter = { emit: jest.fn() };
  const service = new DiscussionsService(prisma as unknown as PrismaService, eventEmitter as unknown as EventEmitter2);
  return { service, prisma, eventEmitter };
}

describe("voteDelta", () => {
  it.each([
    [0, 1, 1],
    [0, -1, -1],
    [1, 0, -1],
    [-1, 0, 1],
    [1, -1, -2],
    [-1, 1, 2],
    [1, 1, 0],
  ] as const)("from %i to %i moves the score by %i", (previous, next, expected) => {
    expect(voteDelta(previous, next)).toBe(expected);
  });
});

describe("DiscussionsService votes", () => {
  it("rejects voting on your own discussion", async () => {
    const { service, prisma } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "me" });

    await expect(service.voteOnDiscussion("me", "d-1", 1)).rejects.toThrow(BadRequestException);
    expect(prisma.discussionVote.upsert).not.toHaveBeenCalled();
  });

  it("switching an upvote to a downvote moves the score by -2", async () => {
    const { service, prisma } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "someone-else" });
    prisma.discussionVote.findUnique.mockResolvedValue({ value: 1 });

    await service.voteOnDiscussion("me", "d-1", -1);

    expect(prisma.discussion.update).toHaveBeenCalledWith(expect.objectContaining({ data: { score: { increment: -2 } } }));
  });

  it("clearing a vote deletes the row and reverses its effect", async () => {
    const { service, prisma } = setup();
    prisma.discussionReply.findUnique.mockResolvedValue({ authorId: "someone-else" });
    prisma.discussionVote.findUnique.mockResolvedValue({ value: 1 });

    await service.voteOnReply("me", "r-1", 0);

    expect(prisma.discussionVote.delete).toHaveBeenCalled();
    expect(prisma.discussionReply.update).toHaveBeenCalledWith(expect.objectContaining({ data: { score: { increment: -1 } } }));
  });

  it("repeating the same vote leaves the score alone", async () => {
    const { service, prisma } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "someone-else" });
    prisma.discussionVote.findUnique.mockResolvedValue({ value: 1 });

    await service.voteOnDiscussion("me", "d-1", 1);

    expect(prisma.discussion.update).not.toHaveBeenCalled();
  });
});

describe("DiscussionsService.markSolution", () => {
  it("only lets the discussion's author accept an answer", async () => {
    const { service, prisma } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "asker", title: "How do I file GST?" });

    await expect(service.markSolution("not-the-asker", "d-1", { replyId: "r-1" })).rejects.toThrow(ForbiddenException);
    expect(prisma.discussion.update).not.toHaveBeenCalled();
  });

  it("rejects a reply from a different discussion", async () => {
    const { service, prisma } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "asker", title: "How do I file GST?" });
    prisma.discussionReply.findUnique.mockResolvedValue({ discussionId: "some-other-thread", authorId: "helper" });

    await expect(service.markSolution("asker", "d-1", { replyId: "r-1" })).rejects.toThrow(BadRequestException);
  });

  it("marks the solution and notifies the person who answered", async () => {
    const { service, prisma, eventEmitter } = setup();
    prisma.discussion.findUnique.mockResolvedValue({ authorId: "asker", title: "How do I file GST?" });
    prisma.discussionReply.findUnique.mockResolvedValue({ discussionId: "d-1", authorId: "helper" });

    await service.markSolution("asker", "d-1", { replyId: "r-1" });

    expect(prisma.discussion.update).toHaveBeenCalledWith({ where: { id: "d-1" }, data: { solutionReplyId: "r-1" } });
    expect(eventEmitter.emit).toHaveBeenCalledWith("discussion.solution-marked", expect.objectContaining({ userId: "helper" }));
  });
});
