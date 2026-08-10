"use client";

import { useSystemHealth } from "@vittamhub/api-client";
import type { DependencyState } from "@vittamhub/types";
import { Badge, Card, ErrorState, Skeleton } from "@vittamhub/ui";
import { AlertTriangle, CheckCircle2, CircleSlash, XCircle } from "lucide-react";

/**
 * "Is VittamHub actually working?" — the panel that was missing when the API
 * sat dead for two days after a transient database outage.
 *
 * Deliberately shows NOT_CONFIGURED as its own state rather than folding it
 * into an error. Most integrations here are optional by design; the point is
 * to make the difference between "we never set this up" and "this is broken"
 * impossible to miss.
 */

const STATE_META: Record<DependencyState, { label: string; icon: typeof CheckCircle2; tone: string; badge: "success" | "warning" | "danger" | "neutral" }> = {
  OPERATIONAL: { label: "Operational", icon: CheckCircle2, tone: "text-success-600", badge: "success" },
  DEGRADED: { label: "Degraded", icon: AlertTriangle, tone: "text-warning-600", badge: "warning" },
  NOT_CONFIGURED: { label: "Not configured", icon: CircleSlash, tone: "text-text-secondary", badge: "neutral" },
  DOWN: { label: "Down", icon: XCircle, tone: "text-danger-600", badge: "danger" },
};

const OVERALL_COPY: Record<string, { title: string; badge: "success" | "warning" | "danger" }> = {
  HEALTHY: { title: "All systems operational", badge: "success" },
  DEGRADED: { title: "Running with degraded services", badge: "warning" },
  IMPAIRED: { title: "User-facing features are unavailable", badge: "danger" },
};

export function SystemHealthCard() {
  const { data, isLoading, isError, refetch } = useSystemHealth();

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <ErrorState
          title="Couldn't load system health"
          description="The admin API didn't respond. That may itself be the outage."
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  const overall = OVERALL_COPY[data.overall] ?? OVERALL_COPY.DEGRADED!;
  // Anything actively blocking a user-facing feature is worth surfacing first.
  const blocking = data.dependencies.filter((d) => d.userFacingImpact && d.state !== "OPERATIONAL");
  const rest = data.dependencies.filter((d) => !blocking.includes(d));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-primary">System health</h2>
          <p className="text-xs text-text-secondary">
            Checked {new Date(data.checkedAt).toLocaleTimeString()} · refreshes every 30s
          </p>
        </div>
        <Badge variant={overall.badge}>{overall.title}</Badge>
      </div>

      {blocking.length > 0 && (
        <div className="rounded-card border border-danger-600/30 bg-danger-50 p-3">
          <p className="text-sm font-medium text-text-primary">
            {blocking.length} {blocking.length === 1 ? "dependency is" : "dependencies are"} blocking a user-facing feature
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-text-secondary">
            {blocking.map((d) => (
              <li key={d.name}>
                <span className="font-medium text-text-primary">{d.name}</span> — {d.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {[...blocking, ...rest].map((dependency) => {
          const meta = STATE_META[dependency.state];
          const Icon = meta.icon;
          return (
            <li key={dependency.name} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{dependency.name}</p>
                  <p className="text-xs text-text-secondary">{dependency.detail}</p>
                </div>
              </div>
              <span className={`shrink-0 text-xs font-medium ${meta.tone}`}>{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
