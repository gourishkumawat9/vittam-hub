import { resolve } from "node:path";

import { config } from "dotenv";

/**
 * Load apps/api/.env so tests share the app's real DATABASE_URL / REDIS_URL /
 * JWT secrets, then redirect the database to an isolated `vittamhub_test`
 * schema — same Neon instance, zero risk to dev `public` data, no separate
 * credentials. Imported by both the Jest globalSetup and every e2e file's
 * setupFiles, so the redirect is in place before AppModule/PrismaService load.
 */
config({ path: resolve(__dirname, "../../.env") });

export const TEST_SCHEMA = "vittamhub_test";

/** Rewrite a Postgres URL to target the isolated test schema. */
export function toTestSchemaUrl(url: string): string {
  const cleaned = url.replace(/([?&])schema=[^&]*/i, "$1").replace(/[?&]$/, "");
  const sep = cleaned.includes("?") ? "&" : "?";
  return `${cleaned}${sep}schema=${TEST_SCHEMA}`;
}

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  throw new Error("DATABASE_URL is missing — is apps/api/.env present? Tests derive the isolated test schema from it.");
}

export const TEST_DATABASE_URL = toTestSchemaUrl(baseUrl);

/** Point every DB connection at the test schema. Runs on import (setupFiles), before the app boots. */
export function applyTestDatabaseEnv(): void {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.SHADOW_DATABASE_URL = TEST_DATABASE_URL;
  process.env.NODE_ENV = "test";
}

applyTestDatabaseEnv();
