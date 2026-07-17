"use client";

import { useIncubators } from "@vittamhub/api-client";
import { IncubatorKind } from "@vittamhub/types";
import type { IncubatorSearchFilters } from "@vittamhub/types";
import { Badge, Card, EmptyState, TagsInput } from "@vittamhub/ui";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

const KIND_TABS: { label: string; value: IncubatorKind[] | undefined }[] = [
  { label: "Both", value: undefined },
  { label: "Incubators", value: [IncubatorKind.INCUBATOR] },
  { label: "Accelerators", value: [IncubatorKind.ACCELERATOR] },
];

export default function IncubatorsDirectoryPage() {
  const [filters, setFilters] = useState<IncubatorSearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useIncubators(filters);
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Incubators</h1>
        <p className="text-sm text-text-secondary">Browse incubators and accelerator programs.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-card border border-border bg-surface p-4">
        {KIND_TABS.map((tab) => {
          const active =
            tab.value === undefined ? filters.kind === undefined : JSON.stringify(filters.kind) === JSON.stringify(tab.value);
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setFilters({ ...filters, kind: tab.value, page: 1 })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active ? "border-brand-primary bg-brand-primary text-white" : "border-border bg-transparent text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <TagsInput
          label="Industries"
          value={filters.industries ?? []}
          onChange={(industries) => setFilters({ ...filters, industries, page: 1 })}
          placeholder="e.g. FinTech, HealthTech…"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((incubator) => (
            <Link key={incubator.id} href={`/incubators/${incubator.id}`}>
              <Card interactive className="flex h-full flex-col gap-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{incubator.organizationName}</h3>
                  <p className="text-xs text-text-secondary">{incubator.programs.length} program(s)</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {incubator.industries.slice(0, 4).map((industry) => (
                    <Badge key={industry} variant="brand">
                      {industry}
                    </Badge>
                  ))}
                </div>
                {incubator.description && <p className="line-clamp-2 text-sm text-text-secondary">{incubator.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No incubators listed yet" description="Check back soon as incubators join VittamHub." />
      )}
    </div>
  );
}
