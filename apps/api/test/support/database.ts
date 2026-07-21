import { PrismaClient } from "@prisma/client";

import { TEST_DATABASE_URL, TEST_SCHEMA } from "./env";

/** A dedicated client for tests to seed/inspect/clean the isolated schema directly (bypassing HTTP). */
export const testDb = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

/**
 * Order-independent wipe of every table in the test schema via a single
 * TRUNCATE ... CASCADE (FK-safe, resets identities). Call in beforeEach so
 * each test starts from a known-empty state. Never touches `public`.
 */
export async function truncateAll(): Promise<void> {
  const rows = await testDb.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = '${TEST_SCHEMA}'`,
  );
  const tables = rows
    .map((r) => r.tablename)
    .filter((t) => t !== "_prisma_migrations")
    .map((t) => `"${TEST_SCHEMA}"."${t}"`);
  if (tables.length === 0) return;
  await testDb.$executeRawUnsafe(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE;`);
}
