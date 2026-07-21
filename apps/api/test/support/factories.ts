import { UserRole, type User } from "@prisma/client";
import * as argon2 from "argon2";

import { testDb } from "./database";

let sequence = 0;

/** Collision-proof unique email for a test run. */
export function uniqueEmail(prefix = "user"): string {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}@test.vittamhub.local`;
}

/** Meets the password policy (10+ chars, upper/lower/number) so it survives Zod + registration. */
export const TEST_PASSWORD = "TestPass123!";

export interface UserFactoryOptions {
  email?: string;
  /** `null` creates a user with no password (e.g. an OAuth-only account). */
  password?: string | null;
  role?: UserRole;
  emailVerified?: boolean;
  fullName?: string;
  deletedAt?: Date | null;
}

/** Insert a ready-to-use user straight into the test DB, password Argon2-hashed like production. */
export async function createUser(options: UserFactoryOptions = {}): Promise<User> {
  const password = options.password === null ? null : (options.password ?? TEST_PASSWORD);
  const passwordHash = password === null ? null : await argon2.hash(password);
  return testDb.user.create({
    data: {
      email: options.email ?? uniqueEmail(),
      fullName: options.fullName ?? "Test User",
      role: options.role ?? UserRole.FOUNDER,
      passwordHash,
      verificationStatus: options.emailVerified ? "VERIFIED" : "UNVERIFIED",
      emailVerifiedAt: options.emailVerified ? new Date() : null,
      deletedAt: options.deletedAt ?? null,
    },
  });
}
