"use client";

import { usePlanLimits, useUpdatePlanLimit } from "@vittamhub/api-client";
import type { PlanLimit } from "@vittamhub/types";
import { Button, Card, Input } from "@vittamhub/ui";
import { useState } from "react";

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

export default function AdminDashboardPage() {
  const { data: planLimits, isLoading } = usePlanLimits();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Admin</h1>

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

      {/* TODO: user/startup verification queue, moderation, audit log viewer, platform metrics */}
    </div>
  );
}
