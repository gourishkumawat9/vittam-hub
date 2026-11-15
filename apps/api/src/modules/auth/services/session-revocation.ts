import type { Prisma } from "@prisma/client";

type RefreshTokenClient = Pick<Prisma.TransactionClient, "refreshToken">;

/**
 * Signs a person out everywhere: every refresh token they hold stops working,
 * so no browser can renew its session. Pass `keepTokenHash` to leave the
 * browser that asked signed in ("log out my other devices", changing a
 * password while logged in).
 *
 * A plain function taking the database client, so it can run inside whatever
 * transaction the caller already has open.
 */
export async function revokeUserSessions(db: RefreshTokenClient, userId: string, keepTokenHash?: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null, ...(keepTokenHash ? { tokenHash: { not: keepTokenHash } } : {}) },
    data: { revokedAt: new Date() },
  });
}
