import type { Currency, MetricKey, Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient | PrismaClient;

export interface TractionMetricsInput {
  monthlyRevenueAmount?: number | null;
  arrAmount?: number | null;
  mrrAmount?: number | null;
  totalUsers?: number | null;
  totalCustomers?: number | null;
  downloads?: number | null;
}

const METRIC_KEY_MAP: Record<keyof TractionMetricsInput, MetricKey> = {
  monthlyRevenueAmount: "MONTHLY_REVENUE",
  arrAmount: "ARR",
  mrrAmount: "MRR",
  totalUsers: "TOTAL_USERS",
  totalCustomers: "TOTAL_CUSTOMERS",
  downloads: "DOWNLOADS",
};

const MONEY_METRICS = new Set<MetricKey>(["MONTHLY_REVENUE", "ARR", "MRR"]);

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Bundle 10 — every traction metric is stored as dated history, never
 * overwritten in place. Called alongside every `StartupTraction` upsert
 * (onboarding publish, and any future "update your metrics" flow) so
 * `MetricObservation` actually accumulates instead of sitting empty.
 * `source`/`tier` default to self-declared/V0 — real V2 attestation
 * (Razorpay/Stripe/bank) is Phase 5+.
 */
export async function recordTractionObservations(
  tx: TxClient,
  startupId: string,
  traction: TractionMetricsInput,
  currency: Currency,
  source = "self-declared",
) {
  const periodStart = startOfMonth(new Date());
  const rows: Prisma.MetricObservationCreateManyInput[] = [];

  for (const [field, metricKey] of Object.entries(METRIC_KEY_MAP) as [keyof TractionMetricsInput, MetricKey][]) {
    const value = traction[field];
    if (value === undefined || value === null) continue;
    rows.push({
      startupId,
      metricKey,
      value,
      currency: MONEY_METRICS.has(metricKey) ? currency : null,
      periodStart,
      source,
      verificationTier: "V0",
    });
  }

  if (rows.length > 0) {
    await tx.metricObservation.createMany({ data: rows });
  }
}
