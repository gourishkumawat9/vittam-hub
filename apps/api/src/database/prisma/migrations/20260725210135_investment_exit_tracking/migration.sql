-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "exitValueAmount" DECIMAL(16,2),
ADD COLUMN     "exitedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

