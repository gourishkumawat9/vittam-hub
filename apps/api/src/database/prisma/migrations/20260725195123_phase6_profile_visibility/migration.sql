-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'INVESTOR_ONLY', 'PRIVATE', 'STEALTH');

-- CreateEnum
CREATE TYPE "MetricVisibility" AS ENUM ('EXACT', 'BAND', 'HIDDEN');

-- AlterTable
ALTER TABLE "startups" ADD COLUMN     "metricsVisibility" "MetricVisibility" NOT NULL DEFAULT 'BAND',
ADD COLUMN     "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';

