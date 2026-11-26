-- Mentor fee options from the mentor-first plan: a group clinic priced per founder,
-- free sessions for idea-stage founders, and sessions a college or incubator pays for.

-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "freeForIdeaStage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groupFeePerFounder" INTEGER,
ADD COLUMN     "sponsoredSessions" BOOLEAN NOT NULL DEFAULT false;
