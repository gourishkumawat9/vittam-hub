import { Injectable } from "@nestjs/common";
import { SubscriptionPlan } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Falls back to this when a plan has no PlanLimit row yet (e.g. right after a fresh migration, before the admin has configured anything). */
const DEFAULT_MONTHLY_CONNECT_REQUEST_LIMIT: Record<SubscriptionPlan, number | null> = {
  FREE: 5,
  FOUNDER_PRO: null,
  INVESTOR_PRO: null,
  ENTERPRISE: null,
};

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyConnectRequestLimit(plan: SubscriptionPlan): Promise<number | null> {
    const row = await this.prisma.planLimit.findUnique({ where: { plan } });
    if (!row) return DEFAULT_MONTHLY_CONNECT_REQUEST_LIMIT[plan];
    return row.monthlyConnectRequestLimit;
  }

  async listAll() {
    const rows = await this.prisma.planLimit.findMany();
    const byPlan = new Map(rows.map((row) => [row.plan, row]));
    return Object.values(SubscriptionPlan).map((plan) => {
      const existing = byPlan.get(plan);
      return {
        plan,
        monthlyConnectRequestLimit: existing?.monthlyConnectRequestLimit ?? DEFAULT_MONTHLY_CONNECT_REQUEST_LIMIT[plan],
        updatedAt: existing?.updatedAt ?? null,
      };
    });
  }

  upsert(plan: SubscriptionPlan, monthlyConnectRequestLimit: number | null) {
    return this.prisma.planLimit.upsert({
      where: { plan },
      create: { plan, monthlyConnectRequestLimit },
      update: { monthlyConnectRequestLimit },
    });
  }
}
