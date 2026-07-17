"use client";

import {
  useAdminUsers,
  useConnectionAcceptanceRate,
  usePlanLimits,
  usePlatformTotals,
  useSignups,
  useUpdatePlanLimit,
  useVerificationFunnel,
  useVerificationOverview,
} from "@vittamhub/api-client";
import { UserRole, type AdminUserListFilters, type PlanLimit, type VerificationOverview } from "@vittamhub/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, ProgressBar, Select } from "@vittamhub/ui";
import { Users2 } from "lucide-react";
import { useState } from "react";

const ENTITY_LABEL: Record<keyof VerificationOverview["counts"], string> = {
  startup: "Startups",
  investor: "Investors",
  mentorProfile: "Mentors",
  incubatorProfile: "Incubators",
};

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  VERIFIED: "success",
  PENDING: "warning",
  UNVERIFIED: "neutral",
  REJECTED: "danger",
};

function VerificationOverviewSection() {
  const { data, isLoading } = useVerificationOverview();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-primary">Verification overview</h2>
        <p className="text-sm text-text-secondary">
          Read-only. Every profile&apos;s verification status is computed automatically from submitted documents and
          profile completeness — there is no manual approve/reject step here.
        </p>
      </div>
      {isLoading || !data ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ENTITY_LABEL) as (keyof VerificationOverview["counts"])[]).map((entity) => (
            <Card key={entity}>
              <CardHeader>
                <CardTitle>{ENTITY_LABEL[entity]}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.counts[entity].length === 0 ? (
                  <span className="text-sm text-text-secondary">No profiles yet</span>
                ) : (
                  data.counts[entity].map((entry) => (
                    <Badge key={entry.status} variant={STATUS_BADGE_VARIANT[entry.status] ?? "neutral"}>
                      {entry.status} · {entry.count}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  FOUNDER_PRO: "Founder Pro",
  INVESTOR_PRO: "Investor Pro",
  ENTERPRISE: "Enterprise",
};

function PlanLimitRow({ planLimit }: { planLimit: PlanLimit }) {
  const updatePlanLimit = useUpdatePlanLimit();
  const [value, setValue] = useState(planLimit.monthlyConnectRequestLimit?.toString() ?? "");

  const save = () => {
    const trimmed = value.trim();
    updatePlanLimit.mutate({
      plan: planLimit.plan,
      input: { monthlyConnectRequestLimit: trimmed === "" ? null : Number(trimmed) },
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{PLAN_LABEL[planLimit.plan] ?? planLimit.plan}</p>
        <p className="text-xs text-text-secondary">Monthly connect requests — blank means unlimited</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-28">
          <Input type="number" min={0} placeholder="Unlimited" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button size="sm" onClick={save} isLoading={updatePlanLimit.isPending}>
          Save
        </Button>
      </div>
    </div>
  );
}

function PlatformTotalsSection() {
  const { data: totals, isLoading } = usePlatformTotals();

  if (isLoading || !totals) return <p className="text-sm text-text-secondary">Loading…</p>;

  const tiles: { label: string; value: number }[] = [
    { label: "Users", value: totals.users },
    { label: "Startups", value: totals.startups },
    { label: "Investors", value: totals.investors },
    { label: "Connect requests", value: totals.connections },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <p className="text-xs text-text-secondary">{tile.label}</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{tile.value}</p>
        </Card>
      ))}
    </div>
  );
}

function SignupsSection() {
  const { data: buckets, isLoading } = useSignups({ bucket: "week", limit: 12 });
  const max = Math.max(1, ...(buckets?.map((b) => b.count) ?? []));

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">Signups per week</h2>
      {isLoading ? (
        <p className="text-xs text-text-secondary">Loading…</p>
      ) : buckets && buckets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {buckets.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center gap-3 text-xs">
              <span className="w-20 shrink-0 truncate text-text-secondary">
                {new Date(bucket.bucket).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-secondary">
                <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(bucket.count / max) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right font-numeric text-text-primary">{bucket.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-secondary">No signups yet.</p>
      )}
    </Card>
  );
}

function ConnectionAcceptanceSection() {
  const { data, isLoading } = useConnectionAcceptanceRate();

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">Connect request acceptance rate</h2>
      {isLoading || !data ? (
        <p className="text-xs text-text-secondary">Loading…</p>
      ) : data.rate != null ? (
        <>
          <ProgressBar value={Math.round(data.rate * 100)} />
          <p className="text-xs text-text-secondary">
            {data.accepted} accepted · {data.declined} declined
          </p>
        </>
      ) : (
        <p className="text-xs text-text-secondary">No responded requests yet.</p>
      )}
    </Card>
  );
}

const FUNNEL_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  UNVERIFIED: "neutral",
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "danger",
};

function VerificationFunnelSection() {
  const { data: funnel, isLoading } = useVerificationFunnel();

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold text-text-primary">Startup verification funnel</h2>
      {isLoading || !funnel ? (
        <p className="text-xs text-text-secondary">Loading…</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {funnel.map((stage) => (
            <Badge key={stage.stage} variant={FUNNEL_BADGE_VARIANT[stage.stage] ?? "neutral"}>
              {stage.stage} · {stage.count}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

const ROLE_OPTIONS = Object.values(UserRole).map((role) => ({ label: role.replace(/_/g, " "), value: role }));

function AdminUsersSection() {
  const [filters, setFilters] = useState<AdminUserListFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useAdminUsers(filters);
  const items = data?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-primary">Users</h2>
        <p className="text-sm text-text-secondary">Read-only list/search — no ban, edit, or role-change actions here.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="max-w-xs flex-1">
          <Input
            placeholder="Search by name or email…"
            value={filters.query ?? ""}
            onChange={(e) => setFilters({ ...filters, query: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="All roles"
            options={ROLE_OPTIONS}
            value={filters.role?.[0]}
            onChange={(role) => setFilters({ ...filters, role: role ? [role as (typeof UserRole)[keyof typeof UserRole]] : undefined, page: 1 })}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : items.length > 0 ? (
        <Card className="p-0">
          <div className="flex flex-col divide-y divide-border">
            {items.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{u.fullName}</p>
                  <p className="text-xs text-text-secondary">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{u.role}</Badge>
                  <Badge variant={u.verificationStatus === "VERIFIED" ? "success" : "neutral"}>{u.verificationStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState icon={Users2} title="No users found" description="Try a different search or role filter." />
      )}
    </section>
  );
}

export default function AdminDashboardPage() {
  const { data: planLimits, isLoading } = usePlanLimits();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Admin</h1>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-primary">Platform overview</h2>
          <p className="text-sm text-text-secondary">Real, read-only counts — no manual moderation actions anywhere in this panel.</p>
        </div>
        <PlatformTotalsSection />
        <div className="grid gap-4 sm:grid-cols-2">
          <SignupsSection />
          <ConnectionAcceptanceSection />
        </div>
        <VerificationFunnelSection />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-primary">Connect request limits</h2>
          <p className="text-sm text-text-secondary">
            Controls how many investor connect requests a founder can send per calendar month, per plan.
          </p>
        </div>
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : (
          <Card className="p-0">
            <div className="flex flex-col divide-y divide-border">
              {planLimits?.map((planLimit) => <PlanLimitRow key={planLimit.plan} planLimit={planLimit} />)}
            </div>
          </Card>
        )}
      </section>

      <VerificationOverviewSection />

      <AdminUsersSection />
    </div>
  );
}
