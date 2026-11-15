import { Prisma } from "@prisma/client";
import { UserRole } from "@vittamhub/types";

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
          "pricingModel",
          "languages",
          "pastStartups",
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
          ...pick(incubator, ["organizationName", "description", "website", "industries", "portfolioCompanies", "affiliatedMentorCount", "kind"]),
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
        universityInfo: pick(university, ["institutionName", "affiliationType", "website", "incubationCellName", "departments", "programsOffered"]),
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
