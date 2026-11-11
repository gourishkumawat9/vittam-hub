import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";

import type { PrismaService } from "../../database/prisma/prisma.service";

import { inSameSandbox, isDemoViewer, sameSandbox } from "./demo-scope";
import { NotDemoGuard } from "./not-demo.guard";

/** A fake `prisma.user.findUnique` over a fixed id → isDemo table. */
function prismaWith(users: Record<string, boolean>) {
  return {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id in users ? { isDemo: users[where.id] } : null),
      ),
    },
  } as unknown as PrismaService;
}

describe("demo sandbox", () => {
  const prisma = prismaWith({ demo1: true, demo2: true, real1: false, real2: false });

  it("treats anonymous and unknown viewers as real, so they never see demo profiles", async () => {
    await expect(isDemoViewer(prisma, undefined)).resolves.toBe(false);
    await expect(isDemoViewer(prisma, null)).resolves.toBe(false);
    await expect(isDemoViewer(prisma, "missing")).resolves.toBe(false);
  });

  it("filters listings to the viewer's own side", async () => {
    expect(sameSandbox(await isDemoViewer(prisma, "demo1"))).toEqual({ owner: { isDemo: true } });
    expect(sameSandbox(await isDemoViewer(prisma, "real1"))).toEqual({ owner: { isDemo: false } });
  });

  it("lets demo talk to demo and real talk to real, never across", async () => {
    await expect(inSameSandbox(prisma, "demo1", "demo2")).resolves.toBe(true);
    await expect(inSameSandbox(prisma, "real1", "real2")).resolves.toBe(true);
    await expect(inSameSandbox(prisma, "demo1", "real1")).resolves.toBe(false);
    await expect(inSameSandbox(prisma, "real1", "demo1")).resolves.toBe(false);
  });

  describe("NotDemoGuard", () => {
    const contextFor = (sub: string) =>
      ({ switchToHttp: () => ({ getRequest: () => ({ user: { sub } }) }) }) as unknown as ExecutionContext;
    const guard = new NotDemoGuard(prisma);

    it("locks account settings for a shared demo login", async () => {
      await expect(guard.canActivate(contextFor("demo1"))).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("lets a real account through", async () => {
      await expect(guard.canActivate(contextFor("real1"))).resolves.toBe(true);
    });
  });
});
