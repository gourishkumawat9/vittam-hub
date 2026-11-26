import { Prisma } from "@prisma/client";
import { DEFAULT_PERSONA_FOR_ROLE, IncubatorKind, InvestorType, MemberPersona, UserRole } from "@vittamhub/types";

import type { PrismaService } from "../../database/prisma/prisma.service";

type Draft = Record<string, unknown>;

/**
 * Turns a database row into the plain values a wizard step holds: no nulls
 * (a step's optional fields are simply absent), decimals as numbers, dates
 * as ISO text.
 */
function plain<T extends Record<string, unknown>>(row: T): Draft {
  const out: Draft = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue;
    if (value instanceof Prisma.Decimal) out[key] = value.toNumber();
    else if (value instanceof Date) out[key] = value.toISOString();
    else out[key] = value;
  }
  return out;
}

function pick<T extends Record<string, unknown>>(row: T, keys: readonly (keyof T)[]): Draft {
  return plain(Object.fromEntries(keys.map((key) => [key, row[key]])));
}

async function personalDetails(prisma: PrismaService, userId: string): Promise<Draft> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, avatarUrl: true, profile: true },
  });
  if (!user) return {};
  const profile = user.profile;
  return plain({
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    mobileNumber: profile?.mobileNumber,
    // The step's date field wants the day alone, "1994-03-21".
    dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10),
    gender: profile?.gender,
    nationality: profile?.nationality,
    linkedinUrl: profile?.linkedinUrl,
    githubUrl: profile?.githubUrl,
    portfolioUrl: profile?.portfolioUrl,
    city: profile?.city,
    state: profile?.state,
    country: profile?.country,
    bio: profile?.bio,
    yearsOfExperience: profile?.yearsOfExperience,
    studentInstitution: profile?.studentInstitution,
    studentCourse: profile?.studentCourse,
    graduationYear: profile?.graduationYear,
    bhaskarId: profile?.bhaskarId,
  });
}

async function startupSections(prisma: PrismaService, userId: string): Promise<Draft> {
  const startup = await prisma.startup.findFirst({
    where: { ownerId: userId, deletedAt: null },
    include: { product: true, market: true, traction: true, funding: true, preference: true, teamMembers: { orderBy: { createdAt: "asc" } } },
  });
  if (!startup) return {};

  return {
    startupInfo: plain({
      name: startup.name,
      tagline: startup.tagline,
      description: startup.description,
      logoUrl: startup.logoUrl,
      website: startup.website,
      // The founder's own label, kept apart from the stage worked out from the three statuses.
      stage: startup.declaredStage ?? startup.stage,
      productStatus: startup.productStatus,
      revenueStatus: startup.revenueStatus,
      fundingStatus: startup.fundingStatus,
      industry: startup.industry,
      subIndustry: startup.subIndustry,
      foundedYear: startup.foundedYear,
      registrationStatus: startup.registrationStatus,
      companyType: startup.companyType,
      registrationNumber: startup.registrationNumber,
      dpiitNumber: startup.dpiitNumber,
      headquarters: startup.headquarters ?? startup.location,
      businessModelSummary: startup.businessModelSummary,
      mission: startup.mission,
      vision: startup.vision,
      problemStatement: startup.problemStatement,
      solution: startup.solution,
      uniqueValueProposition: startup.uniqueValueProposition,
    }),
    product: startup.product
      ? pick(startup.product, [
          "productName",
          "description",
          "currentVersion",
          "website",
          "appStoreUrl",
          "playStoreUrl",
          "demoVideoUrl",
          "pitchVideoUrl",
          "screenshots",
          "technologyStack",
          "hasApi",
        ])
      : {},
    market: startup.market
      ? pick(startup.market, [
          "targetAudience",
          "targetGeography",
          "primaryCustomer",
          "customerModel",
          "tamAmount",
          "samAmount",
          "somAmount",
          "customerPersonas",
          "competitors",
          "competitiveAdvantage",
          "goToMarketStrategy",
        ])
      : {},
    team: {
      teamSize: startup.teamSize,
      hiringStatus: startup.hiringStatus,
      openRoles: startup.openRoles,
      members: startup.teamMembers.map((member) => pick(member, ["category", "fullName", "role", "linkedinUrl", "photoUrl"])),
    },
    traction: startup.traction
      ? pick(startup.traction, [
          "monthlyRevenueAmount",
          "arrAmount",
          "mrrAmount",
          "totalUsers",
          "totalCustomers",
          "downloads",
          "retentionRatePercent",
          "growthRatePercent",
          "partnerships",
          "awards",
          "patents",
          "mediaMentions",
        ])
      : {},
    funding: startup.funding
      ? pick(startup.funding, [
          "fundingTypes",
          "currentRaiseAmount",
          "fundingGoalAmount",
          "valuationAmount",
          "previousInvestors",
          "useOfFunds",
          "runwayMonths",
          "monthlyBurnRateAmount",
        ])
      : {},
    // Documents already on file are managed on the Documents page; this step only takes new ones.
    verification: { documents: [] },
    preferences: { lookingFor: startup.preference?.lookingFor ?? [] },
  };
}

/** Your role at the organisation, kept on your own profile. */
async function designationOf(prisma: PrismaService, userId: string): Promise<Draft> {
  const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { designation: true } });
  return plain({ designation: profile?.designation });
}

async function roleSection(prisma: PrismaService, userId: string, role: string): Promise<Draft> {
  switch (role) {
    case UserRole.FOUNDER:
      return startupSections(prisma, userId);
    case UserRole.INVESTOR: {
      const investor = await prisma.investor.findUnique({ where: { ownerId: userId } });
      if (!investor) return {};
      return {
        investorInfo: pick(investor, [
          "firmName",
          "designation",
          "investorType",
          "website",
          "bio",
          "preferredIndustries",
          "preferredStages",
          "checkSizeMinAmount",
          "checkSizeMaxAmount",
          "preferredGeography",
          "location",
          "portfolioCompanies",
          "investmentThesis",
          "openForPitches",
          "sebiCategory",
          "sebiRegistrationNumber",
        ]),
      };
    }
    case UserRole.MENTOR: {
      const mentor = await prisma.mentorProfile.findUnique({ where: { ownerId: userId } });
      if (!mentor) return {};
      return {
        mentorInfo: pick(mentor, [
          "headline",
          "expertise",
          "industries",
          "yearsExperience",
          "availability",
          "sessionTypes",
          "languages",
          "pastStartups",
          "mentorType",
          "stagesHelped",
          "meetingMode",
          "feeType",
          "sessionFeeAmount",
          "sessionLengthMinutes",
          "firstSessionFree",
        ]),
      };
    }
    case UserRole.INCUBATOR: {
      const incubator = await prisma.incubatorProfile.findUnique({
        where: { ownerId: userId },
        include: { programs: { orderBy: { createdAt: "asc" } } },
      });
      if (!incubator) return {};
      return {
        incubatorInfo: {
          ...pick(incubator, [
            "organizationName",
            "description",
            "website",
            "logoUrl",
            "industries",
            "portfolioCompanies",
            "affiliatedMentorCount",
            "kind",
            "hostType",
            "city",
            "state",
            "yearEstablished",
            "currentIncubatees",
            "graduatedIncubatees",
            "governmentPrograms",
          ]),
          ...(await designationOf(prisma, userId)),
          programs: incubator.programs.map((program) => ({
            ...pick(program, ["name", "description", "durationWeeks", "applicationUrl", "eligibilityCriteria"]),
            ...(program.applicationCycleStart ? { applicationCycleStart: program.applicationCycleStart.toISOString().slice(0, 10) } : {}),
            ...(program.applicationCycleEnd ? { applicationCycleEnd: program.applicationCycleEnd.toISOString().slice(0, 10) } : {}),
          })),
        },
      };
    }
    case UserRole.UNIVERSITY: {
      const university = await prisma.universityProfile.findUnique({ where: { ownerId: userId } });
      if (!university) return {};
      return {
        universityInfo: {
          ...pick(university, [
            "institutionName",
            "affiliationType",
            "website",
            "logoUrl",
            "city",
            "state",
            "aisheCode",
            "incubationCellName",
            "departments",
            "programsOffered",
          ]),
          ...(await designationOf(prisma, userId)),
        },
      };
    }
    default:
      return {};
  }
}

/**
 * The wizard's answers, rebuilt from a profile that is already live.
 *
 * Publishing clears the draft, and the wizard is also how a profile is
 * edited afterwards. Without this it reopened empty: a founder who clicked
 * "Add product details" on their dashboard was asked to type their whole
 * startup in again.
 */
export async function draftFromPublishedProfile(prisma: PrismaService, userId: string, role: string): Promise<Draft> {
  const [personal, sections] = await Promise.all([personalDetails(prisma, userId), roleSection(prisma, userId, role)]);
  return { personalDetails: personal, ...sections };
}

/**
 * The draft a brand-new account's wizard opens on: what the sign-up form
 * already asked (name, mobile, nationality) and what the persona settles
 * (an investment firm is not an angel; an accelerator is not an incubator),
 * so no one types the same thing twice. Null when there is nothing to fill.
 */
export async function draftFromSignUp(prisma: PrismaService, userId: string, role: string): Promise<Draft | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, avatarUrl: true, profile: { select: { mobileNumber: true, nationality: true, persona: true } } },
  });
  if (!user) return null;
  const persona = user.profile?.persona ?? DEFAULT_PERSONA_FOR_ROLE[role as UserRole] ?? null;

  const draft: Draft = {
    personalDetails: plain({
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      mobileNumber: user.profile?.mobileNumber,
      nationality: user.profile?.nationality,
    }),
  };
  if (role === UserRole.INVESTOR) {
    // A firm picks VC, family office, corporate VC or angel network on the next step; an individual is an angel.
    draft.investorInfo = persona === MemberPersona.INVESTMENT_FIRM ? {} : { investorType: InvestorType.ANGEL };
  }
  if (role === UserRole.INCUBATOR) {
    draft.incubatorInfo = { kind: persona === MemberPersona.ACCELERATOR ? IncubatorKind.ACCELERATOR : IncubatorKind.INCUBATOR };
  }
  return draft;
}
