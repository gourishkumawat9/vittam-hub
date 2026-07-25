"use client";

import { useUpdateMyVisibility } from "@vittamhub/api-client";
import { MetricVisibility, ProfileVisibility, type Startup } from "@vittamhub/types";
import { Card, CardHeader, CardTitle, Select } from "@vittamhub/ui";
import { Eye } from "lucide-react";
import { useState } from "react";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const VISIBILITY_OPTIONS = Object.values(ProfileVisibility).map((value) => ({ label: titleCase(value), value }));
const METRIC_VISIBILITY_OPTIONS = Object.values(MetricVisibility).map((value) => ({ label: titleCase(value), value }));

/** Bundle 30 — "founders share real data only if they control who sees it." */
export function VisibilitySettingsCard({ startup }: { startup: Startup }) {
  const updateVisibility = useUpdateMyVisibility();
  const [visibility, setVisibility] = useState(startup.visibility);
  const [metricsVisibility, setMetricsVisibility] = useState(startup.metricsVisibility);

  const save = (next: Partial<{ visibility: typeof visibility; metricsVisibility: typeof metricsVisibility }>) => {
    const nextVisibility = next.visibility ?? visibility;
    const nextMetricsVisibility = next.metricsVisibility ?? metricsVisibility;
    setVisibility(nextVisibility);
    setMetricsVisibility(nextMetricsVisibility);
    updateVisibility.mutate({ visibility: nextVisibility, metricsVisibility: nextMetricsVisibility });
  };

  return (
    <Card className="flex flex-col gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-brand-primary" /> Who can see this
        </CardTitle>
      </CardHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Profile visibility"
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={(value) => save({ visibility: value as typeof visibility })}
        />
        <Select
          label="How revenue/ARR shows publicly"
          hint="Investors always see exact figures once connected"
          options={METRIC_VISIBILITY_OPTIONS}
          value={metricsVisibility}
          onChange={(value) => save({ metricsVisibility: value as typeof metricsVisibility })}
        />
      </div>
    </Card>
  );
}
