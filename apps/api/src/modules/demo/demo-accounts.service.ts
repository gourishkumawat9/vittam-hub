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
 * What the wizard's first step asks everyone for. Filled in so that "Edit
 * profile" on a demo account opens complete and can be saved straight away:
 * with these blank, saving any edit failed on "Personal details: Required".
 * Placeholder values, like everything else on a demo account.
 */
const DEMO_PERSONAL_DETAILS = {
  mobileNumber: "0000000000",
  dateOfBirth: new Date("1995-01-01T00:00:00.000Z"),
  gender: "PREFER_NOT_TO_SAY" as const,
  nationality: "Indian",
  city: "Jaipur",
  state: "Rajasthan",
  country: "India",
  bio: "Demo account for trying VittamHub.",
};

/**
 * One login per stakeholder, so the owner can click through every dashboard
 * on the live site. Every name says "Demo" (CLAUDE.md §2), and every account
 * is `isDemo`, which seals it into the demo sandbox (common/demo/demo-scope.ts):
 * demo accounts only see each other and real users never see them.
 *
 * Deliberately no demo ADMIN: an admin login guarded by a shared password
 * would be a real hole, demo sandbox or not. No service-provider or job-seeker
 * login either while those roles are paused (CLAUDE.md "Current scope").
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
        productStatus: "BETA" as const,
        revenueStatus: "NONE" as const,
        fundingStatus: "BOOTSTRAPPED" as const,
        foundedYear: 2026,
        location: "Jaipur, India",
        headquarters: "Jaipur, India",
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
        // What the three statuses below work out to (stage.util.ts), so saving the profile unchanged doesn't move it.
        stage: "VALIDATION" as const,
        declaredStage: "VALIDATION" as const,
        productStatus: "CONCEPT" as const,
        revenueStatus: "NONE" as const,
        fundingStatus: "BOOTSTRAPPED" as const,
        foundedYear: 2026,
        location: "Bengaluru, India",
        headquarters: "Bengaluru, India",
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
        availability: "Weekday evenings (demo)",
        sessionTypes: ["ONE_ON_ONE" as const],
        pricingModel: "Free",
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
        description:
          "Demo incubator profile for trying VittamHub. Takes student and first-time founders in edtech and fintech from idea to a working MVP.",
        industries: ["EDTECH", "FINTECH"],
        portfolioCompanies: ["Demo Startup", "Demo Fintech Startup"],
        verificationStatus: "VERIFIED" as const,
        verifiedAt: now(),
      };
      const incubator = await tx.incubatorProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
      // The cohort's window moves with each boot, so the demo always has one programme taking applications.
      const day = 24 * 60 * 60 * 1000;
      const programmes = [
        {
          name: "Demo pre-incubation programme",
          description: "12-week demo programme. Idea to MVP stage, unregistered startups welcome.",
          durationWeeks: 12,
          eligibilityCriteria: "Idea to MVP stage. Company registration not required.",
        },
        {
          name: "Demo MVP cohort",
          description: "16-week demo cohort with a weekly mentor review and a demo day at the end.",
          durationWeeks: 16,
          eligibilityCriteria: "A prototype or MVP with first users.",
          applicationCycleStart: new Date(Date.now() - 7 * day),
          applicationCycleEnd: new Date(Date.now() + 28 * day),
        },
      ];
      for (const programme of programmes) {
        const existing = await tx.incubatorProgram.findFirst({ where: { incubatorId: incubator.id, name: programme.name } });
        if (existing) await tx.incubatorProgram.update({ where: { id: existing.id }, data: programme });
        else await tx.incubatorProgram.create({ data: { ...programme, incubatorId: incubator.id } });
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
        affiliationType: "Private",
        incubationCellName: "Demo University Startup Cell",
        departments: ["Management", "Engineering", "Design"],
        programsOffered: ["Student startup programme", "Demo ideation sprint", "Demo final-year project to startup track"],
        verificationStatus: "VERIFIED" as const,
      };
      return tx.universityProfile.upsert({ where: { ownerId }, update: data, create: { ...data, ownerId } });
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
        // Straight to the dashboard on login: /onboarding sends anyone whose wizard isn't COMPLETED back into it.
        // Edits a visitor started and left unsaved are dropped along with everything else a boot resets.
        const profile = { onboardingStatus: "COMPLETED" as const, onboardingDraft: Prisma.JsonNull, ...DEMO_PERSONAL_DETAILS };
        await tx.userProfile.upsert({
          where: { userId: user.id },
          update: profile,
          create: { userId: user.id, ...profile },
        });
        await account.profile?.(tx, user.id);
      });
    }
    // A login dropped from DEMO_ACCOUNTS (or a renamed one) stops working instead of lingering with the shared password.
    const { count: retired } = await this.prisma.user.updateMany({
      where: { isDemo: true, email: { notIn: DEMO_ACCOUNTS.map((a) => a.email) }, passwordHash: { not: null } },
      data: { passwordHash: null },
    });
    if (retired > 0) this.logger.log(`Switched off ${retired} demo logins no longer in DEMO_ACCOUNTS`);
    this.logger.log(`Demo accounts ready: ${DEMO_ACCOUNTS.map((a) => a.email).join(", ")}`);
    return "enabled";
  }
}
