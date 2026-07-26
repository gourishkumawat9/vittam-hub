-- CreateEnum
CREATE TYPE "WatchlistTriggerType" AS ENUM ('REVENUE_ABOVE', 'TRUST_BAND_REACHES', 'GST_VERIFIED', 'MCA_VERIFIED', 'FUNDING_ROUND_OPENED', 'HEADCOUNT_DOUBLED', 'NEW_FOUNDER_ADDED', 'VERIFICATION_COMPLETED', 'NEW_METRICS_UPLOADED', 'NEW_CAP_TABLE_INVESTOR', 'PRODUCT_LAUNCHED', 'PATENT_GRANTED', 'MILESTONE_POSTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WATCHLIST_TRIGGER_FIRED';

-- CreateTable
CREATE TABLE "watchlist_triggers" (
    "id" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "type" "WatchlistTriggerType" NOT NULL,
    "thresholdAmount" DECIMAL(16,2),
    "thresholdBand" "TrustBand",
    "baselineValue" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watchlist_triggers_investorId_idx" ON "watchlist_triggers"("investorId");

-- CreateIndex
CREATE INDEX "watchlist_triggers_startupId_isActive_firedAt_idx" ON "watchlist_triggers"("startupId", "isActive", "firedAt");

-- AddForeignKey
ALTER TABLE "watchlist_triggers" ADD CONSTRAINT "watchlist_triggers_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_triggers" ADD CONSTRAINT "watchlist_triggers_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

