-- CreateTable
CREATE TABLE "investment_mandates" (
    "id" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "industries" "Industry"[],
    "stages" "StartupStage"[],
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "chequeMinAmount" DECIMAL(14,2),
    "chequeMaxAmount" DECIMAL(14,2),
    "geography" TEXT[],
    "revenueStatuses" "RevenueStatus"[],
    "minTrustBand" "TrustBand",
    "raisingOnly" BOOLEAN NOT NULL DEFAULT false,
    "requireVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_mandates_investorId_isActive_idx" ON "investment_mandates"("investorId", "isActive");

-- AddForeignKey
ALTER TABLE "investment_mandates" ADD CONSTRAINT "investment_mandates_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

