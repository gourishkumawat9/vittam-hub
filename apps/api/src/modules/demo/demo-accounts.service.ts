import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Below this the password is refused: these logins sit on the live site. */
export const DEMO_PASSWORD_MIN_LENGTH = 12;

export const DEMO_EMAIL_DOMAIN = "demo.vittamhub.com";

type DemoAccount = {
  email: string;
  fullName: string;
  role: UserRole;
  /** Creates or refreshes this account's role profile. Must be idempotent. */
  profile?: (tx: Prisma.TransactionClient, userId: string) => Promise<unknown>;
};

const now = () => new Date();

/**
 * One login per stakeholder, so the owner can click through every dashboard
 * on the live site. Every name says "Demo" (CLAUDE.md §2), and every account
 * is `isDemo`, which seals it into the demo sandbox (common/demo/demo-scope.ts):
 * demo accounts only see each other and real users never see them.
 *
 * Deliberately no demo ADMIN: an admin login guarded by a shared password
 * would be a real hole, demo sandbox or not.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: `founder@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Founder",
    role: UserRole.FOUNDER,
    profile: (tx, ownerId) => {
      const data = {
        name: "Demo Startup",
        tagline: "AI study planner for college students (demo profile)",
        description:
          "Demo profile for trying VittamHub. Turns a semester syllabus into a daily study plan that adapts when a student falls behind.",
        industry: "EDTECH" as const,
        stage: "MVP" as const,
        declaredStage: "MVP" as const,
        foundedYear: 2026,
        location: "Jaipur, India",
        isFundraising: true,
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
        publishedAt: now(),
      };
      return tx.startup.upsert({
        where: { ownerId },
        update: data,
        create: { ...data, ownerId, slug: "demo-startup" },
      });
    },
  },
  {
    email: `founder2@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Founder Two",
    role: UserRole.FOUNDER,
    profile: (tx, ownerId) => {
      const data = {
        name: "Demo Fintech Startup",
        tagline: "UPI savings app for first-time earners (demo profile)",
        description: "Demo profile for trying VittamHub. Rounds up everyday UPI payments into a savings goal.",
        industry: "FINTECH" as const,
        stage: "IDEA" as const,
        declaredStage: "IDEA" as const,
        foundedYear: 2026,
        location: "Bengaluru, India",
        isFundraising: false,
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
        publishedAt: now(),
      };
      return tx.startup.upsert({
        where: { ownerId },
        update: data,
        create: { ...data, ownerId, slug: "demo-fintech-startup" },
      });
    },
  },
  {
    email: `investor@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Investor",
    role: UserRole.INVESTOR,
    profile: (tx, ownerId) => {
      const data = {
        firmName: "Demo Angel Fund",
        investorType: "ANGEL" as const,
        bio: "Demo investor profile for trying VittamHub. Backs early student and consumer startups.",
        checkSizeMinAmount: new Prisma.Decimal(500000),
        checkSizeMaxAmount: new Prisma.Decimal(2500000),
        preferredStages: ["IDEA", "VALIDATION", "PROTOTYPE", "MVP"] as Prisma.InvestorCreateInput["preferredStages"],
        preferredIndustries: ["EDTECH", "FINTECH"],
        preferredGeography: ["India"],
        openForPitches: true,
        location: "Mumbai, India",
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
      };
      return tx.investor.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
    },
  },
  {
    email: `mentor@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Mentor",
    role: UserRole.MENTOR,
    profile: (tx, ownerId) => {
      const data = {
        headline: "Demo mentor · Product and pricing",
        expertise: ["Product", "Pricing", "Go-to-market"],
        industries: ["EDTECH", "FINTECH"],
        yearsExperience: 8,
        sessionTypes: ["ONE_ON_ONE" as const],
        languages: ["English", "Hindi"],
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
      };
      return tx.mentorProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
    },
  },
  {
    email: `incubator@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Incubator Team",
    role: UserRole.INCUBATOR,
    profile: async (tx, ownerId) => {
      const data = {
        organizationName: "Demo Incubator",
        description: "Demo incubator profile for trying VittamHub.",
        industries: ["EDTECH", "FINTECH"],
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
      };
      const incubator = await tx.incubatorProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
      const existing = await tx.incubatorProgram.findFirst({ where: { incubatorId: incubator.id, name: "Demo pre-incubation programme" } });
      if (!existing) {
        await tx.incubatorProgram.create({
          data: {
            incubatorId: incubator.id,
            name: "Demo pre-incubation programme",
            description: "12-week demo programme. Idea to MVP stage, unregistered startups welcome.",
            durationWeeks: 12,
            eligibilityCriteria: "Idea to MVP stage. Company registration not required.",
          },
        });
      }
      return incubator;
    },
  },
  {
    email: `university@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo University Cell",
    role: UserRole.UNIVERSITY,
    profile: (tx, ownerId) => {
      const data = {
        institutionName: "Demo University",
        incubationCellName: "Demo University Startup Cell",
        departments: ["Management", "Engineering"],
        programsOffered: ["Student startup programme"],
        verificationStatus: "VERIFIED" as const,
      };
      return tx.universityProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
    },
  },
  {
    email: `services@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Service Provider",
    role: UserRole.SERVICE_PROVIDER,
    profile: (tx, ownerId) => {
      const data = {
        companyName: "Demo Legal and CA Services",
        categories: ["LEGAL" as const, "CA" as const],
        description: "Demo service provider profile for trying VittamHub.",
        verificationStatus: "VERIFIED" as const,
      };
      return tx.serviceProviderProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
    },
  },
  {
    email: `talent@${DEMO_EMAIL_DOMAIN}`,
    fullName: "Demo Job Seeker",
    role: UserRole.JOB_SEEKER,
    profile: (tx, ownerId) => {
      const data = {
        headline: "Demo job seeker · Product design",
        skills: ["Figma", "User research"],
        preferredRoles: ["Product designer"],
      };
      return tx.jobSeekerProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
    },
  },
];

/**
 * Turns demo logins on or off from one environment variable, so the owner
 * never needs a terminal or database access:
 *
 * - `DEMO_ACCOUNTS_PASSWORD` set (12+ characters): on every boot, creates or
 *   refreshes every account in DEMO_ACCOUNTS with that password.
 * - Unset: demo logins are switched off (their password is cleared). The
 *   accounts and their sandbox data stay, so turning it back on is instant.
 *
 * The password never lives in the repo. Failures are logged, never thrown:
 * a demo problem must not stop the real API from booting.
 */
@Injectable()
export class DemoAccountsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.sync(this.config.get<string>("DEMO_ACCOUNTS_PASSWORD"));
    } catch (error) {
      this.logger.error(`Demo accounts sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async sync(password: string | undefined): Promise<"enabled" | "disabled"> {
    if (!password) {
      const { count } = await this.prisma.user.updateMany({
        where: { isDemo: true, passwordHash: { not: null } },
        data: { passwordHash: null },
      });
      if (count > 0) this.logger.log(`DEMO_ACCOUNTS_PASSWORD is not set: switched off ${count} demo logins`);
      return "disabled";
    }
    if (password.length < DEMO_PASSWORD_MIN_LENGTH) {
      this.logger.warn(`DEMO_ACCOUNTS_PASSWORD is shorter than ${DEMO_PASSWORD_MIN_LENGTH} characters: demo accounts not created`);
      return this.sync(undefined);
    }

    const passwordHash = await argon2.hash(password);
    for (const account of DEMO_ACCOUNTS) {
      await this.prisma.$transaction(async (tx) => {
        const fields = {
          fullName: account.fullName,
          role: account.role,
          passwordHash,
          isDemo: true,
          verificationStatus: "VERIFIED" as const,
          emailVerifiedAt: now(),
          deletedAt: null,
          // Shared logins: NotDemoGuard blocks turning these on, and a boot clears them anyway.
          twoFactorEnabled: false,
          twoFactorSecret: null,
        };
        const user = await tx.user.upsert({
          where: { email: account.email },
          update: fields,
          create: { email: account.email, ...fields },
        });
        await account.profile?.(tx, user.id);
      });
    }
    this.logger.log(`Demo accounts ready: ${DEMO_ACCOUNTS.map((a) => a.email).join(", ")}`);
    return "enabled";
  }
}
