-- BHASKAR-style sign-up: who someone is (persona), the account fields BHASKAR
-- asks before registration, mentor fees and formats, and the per-stakeholder
-- classifications and documents in docs/13-signup-questions.md. All new
-- columns are nullable or defaulted, so existing rows need no backfill.

-- CreateEnum
CREATE TYPE "MemberPersona" AS ENUM ('STARTUP_FOUNDER', 'EXPLORER', 'STUDENT', 'MENTOR', 'INDIVIDUAL_INVESTOR', 'INVESTMENT_FIRM', 'INCUBATOR', 'ACCELERATOR', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "IncubatorHostType" AS ENUM ('ACADEMIC', 'GOVERNMENT', 'CORPORATE', 'PRIVATE', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "MentorType" AS ENUM ('FOUNDER_OPERATOR', 'INDUSTRY_EXPERT', 'INVESTOR', 'ACADEMIC', 'PROFESSIONAL_ADVISER');

-- CreateEnum
CREATE TYPE "MentorFeeType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('ONLINE', 'IN_PERSON', 'BOTH');

-- AlterEnum
ALTER TYPE "CompanyType" ADD VALUE 'ONE_PERSON_COMPANY';
ALTER TYPE "CompanyType" ADD VALUE 'SECTION_8_COMPANY';
ALTER TYPE "CompanyType" ADD VALUE 'COOPERATIVE_SOCIETY';

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'UDYAM_REGISTRATION';
ALTER TYPE "DocumentType" ADD VALUE 'STUDENT_ID';
ALTER TYPE "DocumentType" ADD VALUE 'SEBI_REGISTRATION';
ALTER TYPE "DocumentType" ADD VALUE 'ACCREDITED_INVESTOR_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE 'SCHEME_SANCTION_LETTER';
ALTER TYPE "DocumentType" ADD VALUE 'AUTHORIZATION_LETTER';

-- AlterEnum
ALTER TYPE "InvestorType" ADD VALUE 'ANGEL_NETWORK';

-- AlterTable
ALTER TABLE "incubator_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "currentIncubatees" INTEGER,
ADD COLUMN     "governmentPrograms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "graduatedIncubatees" INTEGER,
ADD COLUMN     "hostType" "IncubatorHostType",
ADD COLUMN     "state" TEXT,
ADD COLUMN     "yearEstablished" INTEGER;

-- AlterTable
ALTER TABLE "investors" ADD COLUMN     "sebiCategory" TEXT,
ADD COLUMN     "sebiRegistrationNumber" TEXT;

-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "feeType" "MentorFeeType",
ADD COLUMN     "firstSessionFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingMode" "MeetingMode",
ADD COLUMN     "mentorType" "MentorType",
ADD COLUMN     "sessionFeeAmount" INTEGER,
ADD COLUMN     "sessionLengthMinutes" INTEGER,
ADD COLUMN     "stagesHelped" "StartupStage"[] DEFAULT ARRAY[]::"StartupStage"[];

-- AlterTable
ALTER TABLE "startups" ADD COLUMN     "dpiitNumber" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ALTER COLUMN "foundedYear" DROP NOT NULL;

-- AlterTable
ALTER TABLE "university_profiles" ADD COLUMN     "aisheCode" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "bhaskarId" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "persona" "MemberPersona",
ADD COLUMN     "studentCourse" TEXT,
ADD COLUMN     "studentInstitution" TEXT;

