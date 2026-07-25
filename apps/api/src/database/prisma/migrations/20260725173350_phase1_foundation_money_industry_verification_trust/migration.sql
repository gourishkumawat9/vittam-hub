-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USD');

-- CreateEnum
CREATE TYPE "VerificationTier" AS ENUM ('V0', 'V1', 'V2', 'V3');

-- CreateEnum
CREATE TYPE "VerificationRecordStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "MetricKey" AS ENUM ('MONTHLY_REVENUE', 'ARR', 'MRR', 'TOTAL_USERS', 'TOTAL_CUSTOMERS', 'DOWNLOADS', 'TEAM_SIZE', 'VALUATION', 'FUNDING_RAISED', 'RETENTION_RATE_PERCENT', 'GROWTH_RATE_PERCENT', 'MONTHLY_BURN_RATE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('CONCEPT', 'PROTOTYPE', 'BETA', 'LIVE', 'SCALED');

-- CreateEnum
CREATE TYPE "RevenueStatus" AS ENUM ('NONE', 'PILOT', 'FIRST_REVENUE', 'RECURRING', 'PROFITABLE');

-- CreateEnum
CREATE TYPE "FundingStatus" AS ENUM ('BOOTSTRAPPED', 'ANGEL', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C_PLUS', 'PE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TrustBand" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('FINTECH', 'HEALTHTECH', 'EDTECH', 'AGRITECH', 'ECOMMERCE', 'SAAS', 'DEEPTECH', 'AI_ML', 'LOGISTICS', 'MOBILITY', 'REAL_ESTATE', 'MEDIA_ENTERTAINMENT', 'GAMING', 'CLEANTECH_CLIMATE', 'FOODTECH', 'RETAIL_D2C', 'TRAVEL_HOSPITALITY', 'HR_TECH', 'LEGAL_TECH', 'INSURTECH', 'SPACE_TECH', 'MANUFACTURING', 'CONSTRUCTION_PROPTECH', 'SOCIAL_IMPACT', 'ADTECH', 'CYBERSECURITY', 'WEB3_BLOCKCHAIN', 'OTHER');

-- ── Money fields: rename *Usd -> *Amount (data-preserving), add currency (default INR) ──

-- AlterTable: connections
ALTER TABLE "connections" RENAME COLUMN "fundingRequirementUsd" TO "fundingRequirementAmount";
ALTER TABLE "connections" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: investments
ALTER TABLE "investments" RENAME COLUMN "amountUsd" TO "amount";
ALTER TABLE "investments" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: investors
ALTER TABLE "investors" RENAME COLUMN "checkSizeMaxUsd" TO "checkSizeMaxAmount";
ALTER TABLE "investors" RENAME COLUMN "checkSizeMinUsd" TO "checkSizeMinAmount";
ALTER TABLE "investors" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: job_seeker_profiles
ALTER TABLE "job_seeker_profiles" RENAME COLUMN "expectedSalaryMaxUsd" TO "expectedSalaryMaxAmount";
ALTER TABLE "job_seeker_profiles" RENAME COLUMN "expectedSalaryMinUsd" TO "expectedSalaryMinAmount";
ALTER TABLE "job_seeker_profiles" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: jobs_board_postings
ALTER TABLE "jobs_board_postings" RENAME COLUMN "maxSalaryUsd" TO "maxSalaryAmount";
ALTER TABLE "jobs_board_postings" RENAME COLUMN "minSalaryUsd" TO "minSalaryAmount";
ALTER TABLE "jobs_board_postings" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: startup_fundings
ALTER TABLE "startup_fundings" RENAME COLUMN "currentRaiseUsd" TO "currentRaiseAmount";
ALTER TABLE "startup_fundings" RENAME COLUMN "fundingGoalUsd" TO "fundingGoalAmount";
ALTER TABLE "startup_fundings" RENAME COLUMN "monthlyBurnRateUsd" TO "monthlyBurnRateAmount";
ALTER TABLE "startup_fundings" RENAME COLUMN "valuationUsd" TO "valuationAmount";
ALTER TABLE "startup_fundings" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: startup_markets
ALTER TABLE "startup_markets" RENAME COLUMN "samUsd" TO "samAmount";
ALTER TABLE "startup_markets" RENAME COLUMN "somUsd" TO "somAmount";
ALTER TABLE "startup_markets" RENAME COLUMN "tamUsd" TO "tamAmount";
ALTER TABLE "startup_markets" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: startup_tractions
ALTER TABLE "startup_tractions" RENAME COLUMN "arrUsd" TO "arrAmount";
ALTER TABLE "startup_tractions" RENAME COLUMN "monthlyRevenueUsd" TO "monthlyRevenueAmount";
ALTER TABLE "startup_tractions" RENAME COLUMN "mrrUsd" TO "mrrAmount";
ALTER TABLE "startup_tractions" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';

-- AlterTable: startups (money + stage axes + industry taxonomy)
ALTER TABLE "startups" RENAME COLUMN "fundingRaisedUsd" TO "fundingRaisedAmount";
ALTER TABLE "startups" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'INR';
ALTER TABLE "startups" ADD COLUMN "declaredStage" "StartupStage";
ALTER TABLE "startups" ADD COLUMN "fundingStatus" "FundingStatus";
ALTER TABLE "startups" ADD COLUMN "monthsInCurrentStage" INTEGER;
ALTER TABLE "startups" ADD COLUMN "productStatus" "ProductStatus";
ALTER TABLE "startups" ADD COLUMN "revenueStatus" "RevenueStatus";

-- industry: free-text -> fixed taxonomy. Map known existing values, fall back to OTHER
-- for anything unrecognized so no row loses data or fails the migration.
ALTER TABLE "startups" ADD COLUMN "industry_new" "Industry";
UPDATE "startups" SET "industry_new" = CASE
  WHEN lower("industry") IN ('fintech', 'fin-tech', 'financial technology') THEN 'FINTECH'::"Industry"
  WHEN lower("industry") IN ('healthtech', 'health-tech', 'healthcare') THEN 'HEALTHTECH'::"Industry"
  WHEN lower("industry") IN ('edtech', 'education') THEN 'EDTECH'::"Industry"
  WHEN lower("industry") IN ('agritech', 'agriculture') THEN 'AGRITECH'::"Industry"
  WHEN lower("industry") IN ('ecommerce', 'e-commerce') THEN 'ECOMMERCE'::"Industry"
  WHEN lower("industry") IN ('saas') THEN 'SAAS'::"Industry"
  WHEN lower("industry") IN ('deeptech', 'deep-tech') THEN 'DEEPTECH'::"Industry"
  WHEN lower("industry") IN ('ai', 'ml', 'ai/ml', 'artificial intelligence') THEN 'AI_ML'::"Industry"
  WHEN lower("industry") IN ('logistics') THEN 'LOGISTICS'::"Industry"
  WHEN lower("industry") IN ('mobility') THEN 'MOBILITY'::"Industry"
  WHEN lower("industry") IN ('real estate', 'realestate', 'proptech') THEN 'REAL_ESTATE'::"Industry"
  WHEN lower("industry") IN ('media', 'entertainment', 'media & entertainment') THEN 'MEDIA_ENTERTAINMENT'::"Industry"
  WHEN lower("industry") IN ('gaming') THEN 'GAMING'::"Industry"
  WHEN lower("industry") IN ('cleantech', 'climate', 'climatetech') THEN 'CLEANTECH_CLIMATE'::"Industry"
  WHEN lower("industry") IN ('foodtech', 'food') THEN 'FOODTECH'::"Industry"
  WHEN lower("industry") IN ('retail', 'd2c') THEN 'RETAIL_D2C'::"Industry"
  WHEN lower("industry") IN ('travel', 'hospitality') THEN 'TRAVEL_HOSPITALITY'::"Industry"
  WHEN lower("industry") IN ('hr', 'hrtech', 'hr tech') THEN 'HR_TECH'::"Industry"
  WHEN lower("industry") IN ('legaltech', 'legal tech') THEN 'LEGAL_TECH'::"Industry"
  WHEN lower("industry") IN ('insurtech', 'insurance') THEN 'INSURTECH'::"Industry"
  WHEN lower("industry") IN ('spacetech', 'space') THEN 'SPACE_TECH'::"Industry"
  WHEN lower("industry") IN ('manufacturing') THEN 'MANUFACTURING'::"Industry"
  WHEN lower("industry") IN ('construction', 'proptech') THEN 'CONSTRUCTION_PROPTECH'::"Industry"
  WHEN lower("industry") IN ('social impact', 'nonprofit') THEN 'SOCIAL_IMPACT'::"Industry"
  WHEN lower("industry") IN ('adtech', 'advertising') THEN 'ADTECH'::"Industry"
  WHEN lower("industry") IN ('cybersecurity', 'security') THEN 'CYBERSECURITY'::"Industry"
  WHEN lower("industry") IN ('web3', 'blockchain', 'crypto') THEN 'WEB3_BLOCKCHAIN'::"Industry"
  ELSE 'OTHER'::"Industry"
END;
ALTER TABLE "startups" DROP COLUMN "industry";
ALTER TABLE "startups" RENAME COLUMN "industry_new" TO "industry";
ALTER TABLE "startups" ALTER COLUMN "industry" SET NOT NULL;

-- ── New tables ──

-- CreateTable
CREATE TABLE "metric_observations" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "metricKey" "MetricKey" NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "currency" "Currency",
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE,
    "source" TEXT NOT NULL,
    "verificationTier" "VerificationTier" NOT NULL DEFAULT 'V0',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_records" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "tier" "VerificationTier" NOT NULL,
    "method" TEXT NOT NULL,
    "status" "VerificationRecordStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DECIMAL(3,2),
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_score_snapshots" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "band" "TrustBand" NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_observations_startupId_metricKey_periodStart_idx" ON "metric_observations"("startupId", "metricKey", "periodStart");

-- CreateIndex
CREATE INDEX "verification_records_entityType_entityId_field_idx" ON "verification_records"("entityType", "entityId", "field");

-- CreateIndex
CREATE INDEX "verification_records_status_expiresAt_idx" ON "verification_records"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "trust_score_snapshots_entityType_entityId_computedAt_idx" ON "trust_score_snapshots"("entityType", "entityId", "computedAt");

-- CreateIndex
CREATE INDEX "startups_industry_idx" ON "startups"("industry");

-- AddForeignKey
ALTER TABLE "metric_observations" ADD CONSTRAINT "metric_observations_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
