import { PrismaClient, SubscriptionPlan, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

/** Default monthly Connect Request quota per plan — admin-editable afterward via PATCH /v1/admin/plan-limits/:plan. */
const DEFAULT_PLAN_LIMITS: Record<SubscriptionPlan, number | null> = {
  FREE: 5,
  FOUNDER_PRO: null,
  INVESTOR_PRO: null,
  ENTERPRISE: null,
};

/**
 * Idempotent dev-seed: safe to re-run. Extend with realistic fixtures
 * (startups across every stage, investors across every check-size band)
 * as features land — see docs/08-database-planning.md.
 */
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@vittamhub.com" },
    update: {},
    create: {
      email: "admin@vittamhub.com",
      fullName: "VittamHub Admin",
      role: UserRole.ADMIN,
      verificationStatus: "VERIFIED",
      emailVerifiedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console -- CLI seed script; stdout output is the point
  console.log(`Seeded admin user: ${admin.email}`);

  for (const [plan, monthlyConnectRequestLimit] of Object.entries(DEFAULT_PLAN_LIMITS)) {
    await prisma.planLimit.upsert({
      where: { plan: plan as SubscriptionPlan },
      update: {},
      create: { plan: plan as SubscriptionPlan, monthlyConnectRequestLimit },
    });
  }

  // eslint-disable-next-line no-console -- CLI seed script; stdout output is the point
  console.log("Seeded default plan limits");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
