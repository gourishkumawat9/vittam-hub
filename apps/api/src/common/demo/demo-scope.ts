import type { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Demo accounts (`User.isDemo`, created by modules/demo) live in a sealed
 * sandbox: a demo viewer only ever sees other demo accounts, and a real
 * viewer (or an anonymous visitor) never sees a demo account. That keeps
 * "Demo Startup" out of a real investor's discovery feed (CLAUDE.md §2) and
 * stops a demo founder from spending a request on a real investor.
 *
 * Every directory, discovery, recommendation and search query that lists
 * other people's profiles applies `sameSandbox(...)` to its `owner` relation.
 */
export async function isDemoViewer(prisma: Pick<PrismaService, "user">, userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isDemo: true } });
  return user?.isDemo ?? false;
}

/** Where-clause fragment for any profile model whose owner relation is `owner`. */
export function sameSandbox(viewerIsDemo: boolean) {
  return { owner: { isDemo: viewerIsDemo } };
}

/** True when two accounts may interact (connect, book, message): both demo or both real. */
export async function inSameSandbox(prisma: Pick<PrismaService, "user">, userIdA: string, userIdB: string): Promise<boolean> {
  const [a, b] = await Promise.all([isDemoViewer(prisma, userIdA), isDemoViewer(prisma, userIdB)]);
  return a === b;
}
