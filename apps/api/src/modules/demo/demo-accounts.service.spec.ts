import type { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

import type { PrismaService } from "../../database/prisma/prisma.service";

import { DEMO_ACCOUNTS, DEMO_EMAIL_DOMAIN, DemoAccountsService } from "./demo-accounts.service";

const PASSWORD = "demo-password-long-enough";

/** Every profile model a demo account touches, as upsert/find/create mocks; the transaction just runs its callback against the same mock. */
function setup(password?: string) {
  const upsert = () => jest.fn().mockResolvedValue({ id: "profile-id" });
  const tx = {
    user: {
      upsert: jest.fn((args: { where: { email: string }; update: Record<string, unknown>; create: Record<string, unknown> }) =>
        Promise.resolve({ id: `user:${args.where.email}` }),
      ),
    },
    userProfile: { upsert: upsert() },
    startup: { upsert: upsert() },
    investor: { upsert: upsert() },
    mentorProfile: { upsert: upsert() },
    incubatorProfile: { upsert: upsert() },
    incubatorProgram: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
    universityProfile: { upsert: upsert() },
    serviceProviderProfile: { upsert: upsert() },
    jobSeekerProfile: { upsert: upsert() },
  };
  const prisma = {
    ...tx,
    user: { ...tx.user, updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const config = { get: jest.fn().mockReturnValue(password) };
  const service = new DemoAccountsService(prisma as unknown as PrismaService, config as unknown as ConfigService);
  return { service, prisma, tx };
}

describe("DemoAccountsService", () => {
  it("offers one clearly labelled demo login per live stakeholder, and no admin", () => {
    const roles = DEMO_ACCOUNTS.map((a) => a.role);
    // Service providers and job seekers are paused until after the growth stage (CLAUDE.md "Current scope").
    expect(new Set(roles)).toEqual(new Set(["FOUNDER", "INVESTOR", "MENTOR", "INCUBATOR", "UNIVERSITY"]));
    expect(roles).not.toContain("ADMIN");
    for (const account of DEMO_ACCOUNTS) {
      expect(account.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true);
      expect(account.fullName).toMatch(/^Demo /);
    }
  });

  it("switches demo logins off when no password is configured", async () => {
    const { service, prisma } = setup(undefined);
    await expect(service.sync(undefined)).resolves.toBe("disabled");
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { isDemo: true, passwordHash: { not: null } },
      data: { passwordHash: null },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a short password and switches demo logins off", async () => {
    const { service, prisma } = setup();
    await expect(service.sync("short")).resolves.toBe("disabled");
    expect(prisma.user.updateMany).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates every demo account in the sandbox, with the password hashed and a profile each", async () => {
    const { service, tx } = setup();
    await expect(service.sync(PASSWORD)).resolves.toBe("enabled");

    expect(tx.user.upsert).toHaveBeenCalledTimes(DEMO_ACCOUNTS.length);
    for (const [args] of tx.user.upsert.mock.calls) {
      for (const fields of [args.update, args.create]) {
        expect(fields.isDemo).toBe(true);
        expect(fields.twoFactorEnabled).toBe(false);
        expect(fields.passwordHash).not.toBe(PASSWORD);
        await expect(argon2.verify(fields.passwordHash as string, PASSWORD)).resolves.toBe(true);
      }
    }
    // Onboarding is marked done, so a demo login lands on its dashboard rather than the setup wizard.
    expect(tx.userProfile.upsert).toHaveBeenCalledTimes(DEMO_ACCOUNTS.length);
    for (const [args] of tx.userProfile.upsert.mock.calls as [{ update: { onboardingStatus: string }; create: { onboardingStatus: string } }][]) {
      expect(args.update.onboardingStatus).toBe("COMPLETED");
      expect(args.create.onboardingStatus).toBe("COMPLETED");
    }
    expect(tx.startup.upsert).toHaveBeenCalledTimes(2);
    expect(tx.serviceProviderProfile.upsert).not.toHaveBeenCalled();
    expect(tx.jobSeekerProfile.upsert).not.toHaveBeenCalled();
    expect(tx.investor.upsert).toHaveBeenCalledTimes(1);
    expect(tx.incubatorProgram.create).toHaveBeenCalledTimes(1);
  });

  it("switches off a demo login that was dropped from the list", async () => {
    const { service, prisma } = setup();
    await service.sync(PASSWORD);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { isDemo: true, email: { notIn: DEMO_ACCOUNTS.map((a) => a.email) }, passwordHash: { not: null } },
      data: { passwordHash: null },
    });
  });

  it("never stops the API from booting when the database call fails", async () => {
    const { service, prisma } = setup(undefined);
    prisma.user.updateMany.mockRejectedValue(new Error("db down"));
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
