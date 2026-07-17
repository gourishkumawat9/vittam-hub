-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'INVESTOR', 'MENTOR', 'INCUBATOR', 'UNIVERSITY', 'SERVICE_PROVIDER', 'JOB_SEEKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'LOGIN_MFA');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INCORPORATION_CERTIFICATE', 'PAN', 'GST', 'DPIIT_RECOGNITION', 'TRADEMARK', 'PATENT', 'PITCH_DECK', 'FINANCIAL_STATEMENT', 'GOVERNMENT_ID', 'DIGITAL_SIGNATURE', 'CAP_TABLE', 'LEGAL_CONTRACT', 'DUE_DILIGENCE_REPORT', 'MEETING_NOTES', 'OTHER');

-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('IDEA', 'VALIDATION', 'PROTOTYPE', 'MVP', 'CUSTOMERS', 'REVENUE', 'FUNDED', 'SCALING', 'UNICORN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('NOT_REGISTERED', 'IN_PROGRESS', 'REGISTERED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRIVATE_LIMITED', 'LLP', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'PUBLIC_LIMITED', 'NOT_REGISTERED', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerModel" AS ENUM ('B2B', 'B2C', 'D2C', 'B2B2C');

-- CreateEnum
CREATE TYPE "TeamMemberCategory" AS ENUM ('FOUNDER', 'COFOUNDER', 'EMPLOYEE', 'ADVISOR', 'BOARD_MEMBER');

-- CreateEnum
CREATE TYPE "HiringStatus" AS ENUM ('NOT_HIRING', 'HIRING', 'OPEN_TO_ADVISORS');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('IDEA_CREATED', 'PROTOTYPE', 'MVP', 'FIRST_CUSTOMER', 'REVENUE', 'SEED_ROUND', 'AWARD', 'HIRING', 'PRODUCT_LAUNCH', 'OTHER');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('TARGET', 'INTERESTED', 'MEETING', 'DUE_DILIGENCE', 'NEGOTIATION', 'INVESTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('BOOTSTRAPPED', 'GRANT', 'ANGEL', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C_PLUS');

-- CreateEnum
CREATE TYPE "LookingForType" AS ENUM ('INVESTORS', 'MENTORS', 'INCUBATORS', 'ACCELERATORS', 'SERVICE_PROVIDERS', 'OFFICE_SPACE', 'COFOUNDER', 'EMPLOYEES', 'GRANTS', 'GOVERNMENT_SCHEMES', 'CORPORATE_PARTNERSHIPS');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('ANGEL', 'VC_FIRM', 'FAMILY_OFFICE', 'CORPORATE_VC', 'ACCELERATOR');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ONE_ON_ONE', 'GROUP', 'WORKSHOP', 'ADVISORY');

-- CreateEnum
CREATE TYPE "IncubatorKind" AS ENUM ('INCUBATOR', 'ACCELERATOR');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('LEGAL', 'FINANCE', 'CA', 'MARKETING', 'BRANDING', 'TECHNOLOGY', 'RECRUITMENT', 'IP', 'HR', 'OPERATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('IMMEDIATE', 'TWO_WEEKS', 'ONE_MONTH', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'IGNORED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'PROFILE_VERIFIED', 'PROFILE_REJECTED', 'PROFILE_VIEWED', 'DOCUMENT_UPLOADED', 'MILESTONE_ADDED', 'MEETING_SCHEDULED', 'NEW_MESSAGE', 'BILLING_ISSUE', 'SYSTEM', 'MENTOR_BOOKING_REQUESTED', 'MENTOR_BOOKING_RESPONDED', 'JOB_APPLICATION_RECEIVED', 'JOB_APPLICATION_STATUS_CHANGED', 'POST_COMMENTED', 'FOUNDER_REVIEW_RECEIVED', 'NEW_FOLLOWER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'ADVISORY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'REJECTED', 'HIRED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('FOUNDER_POST', 'STARTUP_UPDATE', 'ANNOUNCEMENT', 'POLL', 'EVENT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'FOUNDER_PRO', 'INVESTOR_PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "emailVerifiedAt" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mobileNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "nationality" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "bio" TEXT,
    "yearsOfExperience" INTEGER,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDraft" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_recovery_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "industry" TEXT NOT NULL,
    "subIndustry" TEXT,
    "stage" "StartupStage" NOT NULL DEFAULT 'IDEA',
    "foundedYear" INTEGER NOT NULL,
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'NOT_REGISTERED',
    "companyType" "CompanyType",
    "headquarters" TEXT,
    "businessModelSummary" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "problemStatement" TEXT,
    "solution" TEXT,
    "uniqueValueProposition" TEXT,
    "teamSize" INTEGER NOT NULL DEFAULT 1,
    "hiringStatus" "HiringStatus" NOT NULL DEFAULT 'NOT_HIRING',
    "openRoles" TEXT[],
    "location" TEXT NOT NULL,
    "fundingRaisedUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isFundraising" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "termsAcceptedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_milestones" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "achievedAt" TIMESTAMP(3) NOT NULL,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_team_members" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "category" "TeamMemberCategory" NOT NULL DEFAULT 'EMPLOYEE',
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_products" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "productName" TEXT,
    "description" TEXT,
    "currentVersion" TEXT,
    "website" TEXT,
    "appStoreUrl" TEXT,
    "playStoreUrl" TEXT,
    "demoVideoUrl" TEXT,
    "pitchVideoUrl" TEXT,
    "screenshots" TEXT[],
    "technologyStack" TEXT[],
    "hasApi" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_markets" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "targetAudience" TEXT,
    "targetGeography" TEXT[],
    "primaryCustomer" TEXT,
    "customerModel" "CustomerModel"[],
    "tamUsd" DECIMAL(16,2),
    "samUsd" DECIMAL(16,2),
    "somUsd" DECIMAL(16,2),
    "customerPersonas" JSONB,
    "competitors" JSONB,
    "competitiveAdvantage" TEXT,
    "goToMarketStrategy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_tractions" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "monthlyRevenueUsd" DECIMAL(14,2),
    "arrUsd" DECIMAL(14,2),
    "mrrUsd" DECIMAL(14,2),
    "totalUsers" INTEGER,
    "totalCustomers" INTEGER,
    "downloads" INTEGER,
    "retentionRatePercent" DECIMAL(5,2),
    "growthRatePercent" DECIMAL(6,2),
    "partnerships" TEXT[],
    "awards" TEXT[],
    "patents" TEXT[],
    "mediaMentions" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_tractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_fundings" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "fundingTypes" "FundingType"[],
    "currentRaiseUsd" DECIMAL(14,2),
    "fundingGoalUsd" DECIMAL(14,2),
    "valuationUsd" DECIMAL(16,2),
    "previousInvestors" TEXT[],
    "useOfFunds" TEXT,
    "runwayMonths" INTEGER,
    "monthlyBurnRateUsd" DECIMAL(14,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_fundings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_preferences" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "lookingFor" "LookingForType"[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs_board_postings" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "location" TEXT NOT NULL,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT[],
    "minSalaryUsd" DECIMAL(12,2),
    "maxSalaryUsd" DECIMAL(12,2),
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_board_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "firmName" TEXT,
    "designation" TEXT,
    "investorType" "InvestorType" NOT NULL,
    "bio" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "checkSizeMinUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "checkSizeMaxUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "preferredStages" "StartupStage"[],
    "preferredIndustries" TEXT[],
    "preferredGeography" TEXT[],
    "portfolioCompanies" TEXT[],
    "investmentThesis" TEXT,
    "openForPitches" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "headline" TEXT,
    "expertise" TEXT[],
    "industries" TEXT[],
    "yearsExperience" INTEGER,
    "availability" TEXT,
    "sessionTypes" "SessionType"[],
    "pricingModel" TEXT,
    "languages" TEXT[],
    "pastStartups" TEXT[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incubator_profiles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "organizationName" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "industries" TEXT[],
    "portfolioCompanies" TEXT[],
    "affiliatedMentorCount" INTEGER,
    "kind" "IncubatorKind" NOT NULL DEFAULT 'INCUBATOR',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incubator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incubator_programs" (
    "id" UUID NOT NULL,
    "incubatorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationWeeks" INTEGER,
    "applicationCycleStart" TIMESTAMP(3),
    "applicationCycleEnd" TIMESTAMP(3),
    "applicationUrl" TEXT,
    "eligibilityCriteria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incubator_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_booking_requests" (
    "id" UUID NOT NULL,
    "founderId" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "startupId" UUID,
    "sessionType" "SessionType",
    "message" TEXT NOT NULL,
    "preferredTimes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_reviews" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "founderId" UUID NOT NULL,
    "bookingRequestId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founder_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_profiles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "institutionName" TEXT NOT NULL,
    "affiliationType" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "incubationCellName" TEXT,
    "departments" TEXT[],
    "programsOffered" TEXT[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_provider_profiles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "categories" "ServiceCategory"[],
    "description" TEXT,
    "pricingModel" TEXT,
    "yearsExperience" INTEGER,
    "clientsServed" INTEGER,
    "website" TEXT,
    "logoUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_profiles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "headline" TEXT,
    "resumeUrl" TEXT,
    "skills" TEXT[],
    "preferredRoles" TEXT[],
    "expectedSalaryMinUsd" DECIMAL(12,2),
    "expectedSalaryMaxUsd" DECIMAL(12,2),
    "availability" "AvailabilityType" NOT NULL DEFAULT 'FLEXIBLE',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_seeker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experience_entries" (
    "id" UUID NOT NULL,
    "jobSeekerId" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "work_experience_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_entries" (
    "id" UUID NOT NULL,
    "jobSeekerId" UUID NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "education_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "startupId" UUID,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "introduction" TEXT,
    "fundingRequirementUsd" INTEGER,
    "pitchDeckUrl" TEXT,
    "executiveSummaryUrl" TEXT,
    "demoLinkUrl" TEXT,
    "infoRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "videoCallUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_follows" (
    "id" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "notifyOnUpdate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "listName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "followerId" UUID NOT NULL,
    "followingId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_profile_views" (
    "id" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "viewDate" DATE NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_entries" (
    "id" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'TARGET',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" UUID NOT NULL,
    "investorId" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountUsd" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "monthlyConnectRequestLimit" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "startupId" UUID,
    "type" "PostType" NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "eventStartsAt" TIMESTAMP(3),
    "eventLocation" TEXT,
    "eventUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "postId" UUID,
    "commentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_bookmarks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" UUID NOT NULL,
    "pollOptionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "otp_codes_userId_purpose_idx" ON "otp_codes"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "mfa_recovery_codes_userId_idx" ON "mfa_recovery_codes"("userId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "startups_ownerId_key" ON "startups"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "startups_slug_key" ON "startups"("slug");

-- CreateIndex
CREATE INDEX "startups_industry_idx" ON "startups"("industry");

-- CreateIndex
CREATE INDEX "startups_stage_idx" ON "startups"("stage");

-- CreateIndex
CREATE INDEX "startups_isFundraising_idx" ON "startups"("isFundraising");

-- CreateIndex
CREATE INDEX "startups_isPublic_verificationStatus_idx" ON "startups"("isPublic", "verificationStatus");

-- CreateIndex
CREATE INDEX "startup_milestones_startupId_achievedAt_idx" ON "startup_milestones"("startupId", "achievedAt");

-- CreateIndex
CREATE INDEX "startup_team_members_startupId_idx" ON "startup_team_members"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_products_startupId_key" ON "startup_products"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_markets_startupId_key" ON "startup_markets"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_tractions_startupId_key" ON "startup_tractions"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_fundings_startupId_key" ON "startup_fundings"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_preferences_startupId_key" ON "startup_preferences"("startupId");

-- CreateIndex
CREATE INDEX "jobs_board_postings_startupId_idx" ON "jobs_board_postings"("startupId");

-- CreateIndex
CREATE INDEX "jobs_board_postings_status_idx" ON "jobs_board_postings"("status");

-- CreateIndex
CREATE INDEX "job_applications_jobId_idx" ON "job_applications"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_jobId_applicantId_key" ON "job_applications"("jobId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "investors_ownerId_key" ON "investors"("ownerId");

-- CreateIndex
CREATE INDEX "investors_investorType_idx" ON "investors"("investorType");

-- CreateIndex
CREATE INDEX "investors_isPublic_verificationStatus_idx" ON "investors"("isPublic", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_ownerId_key" ON "mentor_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "mentor_profiles_isPublic_verificationStatus_idx" ON "mentor_profiles"("isPublic", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "incubator_profiles_ownerId_key" ON "incubator_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "incubator_profiles_isPublic_verificationStatus_idx" ON "incubator_profiles"("isPublic", "verificationStatus");

-- CreateIndex
CREATE INDEX "incubator_programs_incubatorId_idx" ON "incubator_programs"("incubatorId");

-- CreateIndex
CREATE INDEX "mentor_booking_requests_mentorId_status_idx" ON "mentor_booking_requests"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentor_booking_requests_founderId_idx" ON "mentor_booking_requests"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "founder_reviews_bookingRequestId_key" ON "founder_reviews"("bookingRequestId");

-- CreateIndex
CREATE INDEX "founder_reviews_founderId_idx" ON "founder_reviews"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "university_profiles_ownerId_key" ON "university_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "university_profiles_isPublic_verificationStatus_idx" ON "university_profiles"("isPublic", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "service_provider_profiles_ownerId_key" ON "service_provider_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "service_provider_profiles_isPublic_verificationStatus_idx" ON "service_provider_profiles"("isPublic", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_profiles_ownerId_key" ON "job_seeker_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "work_experience_entries_jobSeekerId_idx" ON "work_experience_entries"("jobSeekerId");

-- CreateIndex
CREATE INDEX "education_entries_jobSeekerId_idx" ON "education_entries"("jobSeekerId");

-- CreateIndex
CREATE INDEX "connections_recipientId_status_idx" ON "connections"("recipientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "connections_requesterId_recipientId_startupId_key" ON "connections"("requesterId", "recipientId", "startupId");

-- CreateIndex
CREATE INDEX "meetings_connectionId_idx" ON "meetings"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "startup_follows_investorId_startupId_key" ON "startup_follows"("investorId", "startupId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "startup_profile_views_startupId_viewDate_idx" ON "startup_profile_views"("startupId", "viewDate");

-- CreateIndex
CREATE UNIQUE INDEX "startup_profile_views_startupId_investorId_viewDate_key" ON "startup_profile_views"("startupId", "investorId", "viewDate");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_entries_investorId_startupId_key" ON "pipeline_entries"("investorId", "startupId");

-- CreateIndex
CREATE UNIQUE INDEX "investments_investorId_startupId_key" ON "investments"("investorId", "startupId");

-- CreateIndex
CREATE INDEX "messages_connectionId_createdAt_idx" ON "messages"("connectionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_plan_key" ON "plan_limits"("plan");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "posts_type_createdAt_idx" ON "posts"("type", "createdAt");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "comments_postId_createdAt_idx" ON "comments"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "likes"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_commentId_key" ON "likes"("userId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "post_bookmarks_userId_postId_key" ON "post_bookmarks"("userId", "postId");

-- CreateIndex
CREATE INDEX "poll_options_postId_idx" ON "poll_options"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_userId_pollOptionId_key" ON "poll_votes"("userId", "pollOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_postId_userId_key" ON "event_rsvps"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "mfa_recovery_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_milestones" ADD CONSTRAINT "startup_milestones_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_team_members" ADD CONSTRAINT "startup_team_members_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_products" ADD CONSTRAINT "startup_products_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_markets" ADD CONSTRAINT "startup_markets_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_tractions" ADD CONSTRAINT "startup_tractions_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_fundings" ADD CONSTRAINT "startup_fundings_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_preferences" ADD CONSTRAINT "startup_preferences_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs_board_postings" ADD CONSTRAINT "jobs_board_postings_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs_board_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investors" ADD CONSTRAINT "investors_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incubator_profiles" ADD CONSTRAINT "incubator_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incubator_programs" ADD CONSTRAINT "incubator_programs_incubatorId_fkey" FOREIGN KEY ("incubatorId") REFERENCES "incubator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_booking_requests" ADD CONSTRAINT "mentor_booking_requests_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_booking_requests" ADD CONSTRAINT "mentor_booking_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_booking_requests" ADD CONSTRAINT "mentor_booking_requests_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_reviews" ADD CONSTRAINT "founder_reviews_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_reviews" ADD CONSTRAINT "founder_reviews_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_reviews" ADD CONSTRAINT "founder_reviews_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "mentor_booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_profiles" ADD CONSTRAINT "university_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_experience_entries" ADD CONSTRAINT "work_experience_entries_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_entries" ADD CONSTRAINT "education_entries_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_follows" ADD CONSTRAINT "startup_follows_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_follows" ADD CONSTRAINT "startup_follows_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_profile_views" ADD CONSTRAINT "startup_profile_views_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_profile_views" ADD CONSTRAINT "startup_profile_views_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_entries" ADD CONSTRAINT "pipeline_entries_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_entries" ADD CONSTRAINT "pipeline_entries_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
