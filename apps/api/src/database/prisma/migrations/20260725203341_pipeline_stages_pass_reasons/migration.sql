-- CreateEnum
CREATE TYPE "PassReason" AS ENUM ('TOO_EARLY', 'NO_TRACTION', 'OUTSIDE_THESIS', 'WEAK_TEAM', 'VALUATION_TOO_HIGH', 'COMPETITIVE_CONFLICT', 'REGULATORY_RISK', 'NO_PMF', 'TIMING', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "PipelineStage_new" AS ENUM ('SOURCED', 'SCREENING', 'DUE_DILIGENCE', 'INVESTMENT_COMMITTEE', 'TERM_SHEET', 'CLOSED', 'PASSED');
ALTER TABLE "pipeline_entries" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "pipeline_entries" ALTER COLUMN "stage" TYPE "PipelineStage_new" USING ("stage"::text::"PipelineStage_new");
ALTER TYPE "PipelineStage" RENAME TO "PipelineStage_old";
ALTER TYPE "PipelineStage_new" RENAME TO "PipelineStage";
DROP TYPE "PipelineStage_old";
ALTER TABLE "pipeline_entries" ALTER COLUMN "stage" SET DEFAULT 'SOURCED';
COMMIT;

-- AlterTable
ALTER TABLE "pipeline_entries" ADD COLUMN     "mandateId" UUID,
ADD COLUMN     "passNote" TEXT,
ADD COLUMN     "passReason" "PassReason",
ADD COLUMN     "passedAt" TIMESTAMP(3),
ALTER COLUMN "stage" SET DEFAULT 'SOURCED';

-- CreateIndex
CREATE INDEX "pipeline_entries_investorId_stage_idx" ON "pipeline_entries"("investorId", "stage");

-- AddForeignKey
ALTER TABLE "pipeline_entries" ADD CONSTRAINT "pipeline_entries_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "investment_mandates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

