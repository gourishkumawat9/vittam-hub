-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PORTFOLIO_INVESTMENT', 'LEAD_INVESTOR', 'BOARD_SEAT', 'INCUBATOR_ALUMNUS', 'UNIVERSITY_SPINOUT', 'STRATEGIC_PARTNER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DENIED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_CLAIM_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_CLAIM_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_CLAIM_DENIED';

-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'PHONE_VERIFICATION';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "relationship_claims" (
    "id" UUID NOT NULL,
    "claimantType" TEXT NOT NULL,
    "claimantId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "evidenceUrl" TEXT,
    "respondedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "relationship_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relationship_claims_claimantType_claimantId_idx" ON "relationship_claims"("claimantType", "claimantId");

-- CreateIndex
CREATE INDEX "relationship_claims_targetType_targetId_status_idx" ON "relationship_claims"("targetType", "targetId", "status");

