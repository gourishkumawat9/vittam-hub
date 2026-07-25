-- CreateEnum
CREATE TYPE "FundingInstrument" AS ENUM ('EQUITY', 'SAFE', 'CCPS', 'DEBT', 'GRANT');

-- CreateTable
CREATE TABLE "document_grants" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "grantedToId" UUID NOT NULL,
    "grantedById" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "requireNda" BOOLEAN NOT NULL DEFAULT false,
    "ndaAcceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_views" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "viewerId" UUID NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_rounds" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "roundType" "FundingType" NOT NULL,
    "instrument" "FundingInstrument" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "amount" DECIMAL(16,2) NOT NULL,
    "preMoneyValuation" DECIMAL(16,2),
    "postMoneyValuation" DECIMAL(16,2),
    "leadInvestorName" TEXT,
    "dilutionPercent" DECIMAL(5,2),
    "closedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_grants_grantedToId_idx" ON "document_grants"("grantedToId");

-- CreateIndex
CREATE UNIQUE INDEX "document_grants_documentId_grantedToId_key" ON "document_grants"("documentId", "grantedToId");

-- CreateIndex
CREATE INDEX "document_views_documentId_viewedAt_idx" ON "document_views"("documentId", "viewedAt");

-- CreateIndex
CREATE INDEX "funding_rounds_startupId_closedAt_idx" ON "funding_rounds"("startupId", "closedAt");

-- AddForeignKey
ALTER TABLE "document_grants" ADD CONSTRAINT "document_grants_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_grants" ADD CONSTRAINT "document_grants_grantedToId_fkey" FOREIGN KEY ("grantedToId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_grants" ADD CONSTRAINT "document_grants_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_views" ADD CONSTRAINT "document_views_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_views" ADD CONSTRAINT "document_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

