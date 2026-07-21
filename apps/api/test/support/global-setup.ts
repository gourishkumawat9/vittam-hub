import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { TEST_DATABASE_URL, TEST_SCHEMA } from "./env";

/**
 * Runs once before the whole e2e suite: ensure the isolated schema exists and
 * is migrated to the current Prisma schema. Idempotent — safe to re-run, and
 * uses `migrate deploy` (applies committed migrations only, no shadow DB).
 */
export default async function globalSetup(): Promise<void> {
  const apiRoot = resolve(__dirname, "../..");
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, SHADOW_DATABASE_URL: TEST_DATABASE_URL };
  const schemaFlag = "--schema=src/database/prisma/schema.prisma";

  execSync(`echo 'CREATE SCHEMA IF NOT EXISTS ${TEST_SCHEMA};' | npx prisma db execute --stdin ${schemaFlag}`, {
    cwd: apiRoot,
    env,
    stdio: "pipe",
  });
  execSync(`npx prisma migrate deploy ${schemaFlag}`, { cwd: apiRoot, env, stdio: "pipe" });
}
