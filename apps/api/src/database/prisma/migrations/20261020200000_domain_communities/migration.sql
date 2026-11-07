-- CreateEnum
CREATE TYPE "DiscussionKind" AS ENUM ('QUESTION', 'DISCUSSION');

-- CreateTable
CREATE TABLE "community_memberships" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "industry" "Industry" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussions" (
    "id" UUID NOT NULL,
    "industry" "Industry" NOT NULL,
    "authorId" UUID NOT NULL,
    "kind" "DiscussionKind" NOT NULL DEFAULT 'QUESTION',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "solutionReplyId" UUID,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_replies" (
    "id" UUID NOT NULL,
    "discussionId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_votes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "discussionId" UUID,
    "replyId" UUID,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_memberships_industry_idx" ON "community_memberships"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_userId_industry_key" ON "community_memberships"("userId", "industry");

-- CreateIndex
CREATE UNIQUE INDEX "discussions_solutionReplyId_key" ON "discussions"("solutionReplyId");

-- CreateIndex
CREATE INDEX "discussions_industry_lastActivityAt_idx" ON "discussions"("industry", "lastActivityAt");

-- CreateIndex
CREATE INDEX "discussions_industry_createdAt_idx" ON "discussions"("industry", "createdAt");

-- CreateIndex
CREATE INDEX "discussions_industry_score_idx" ON "discussions"("industry", "score");

-- CreateIndex
CREATE INDEX "discussions_authorId_idx" ON "discussions"("authorId");

-- CreateIndex
CREATE INDEX "discussion_replies_discussionId_createdAt_idx" ON "discussion_replies"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "discussion_replies_authorId_idx" ON "discussion_replies"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_votes_userId_discussionId_key" ON "discussion_votes"("userId", "discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_votes_userId_replyId_key" ON "discussion_votes"("userId", "replyId");

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_solutionReplyId_fkey" FOREIGN KEY ("solutionReplyId") REFERENCES "discussion_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "discussion_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hand-added: Prisma can't express CHECK constraints. Belt-and-braces for the
-- service-layer rules (exactly one vote target; a vote is +1 or -1).
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_one_target_check" CHECK (("discussionId" IS NULL) <> ("replyId" IS NULL));
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_value_check" CHECK ("value" IN (-1, 1));
