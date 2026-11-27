"use client";

import { useIncubators } from "@vittamhub/api-client";
import { IncubatorKind } from "@vittamhub/types";
import type { IncubatorSearchFilters } from "@vittamhub/types";
import { Avatar, Badge, Card, EmptyState, Input } from "@vittamhub/ui";
import { ArrowRight, Building2, CalendarRange, Search } from "@vittamhub/ui/icons";
import Link from "next/link";
import { useEffect, useState } from "react";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KIND_LABEL, industryLabel, programmeStatus, sortProgrammes } from "@/components/dashboard/incubator/programmes";
import { cn } from "@/lib/utils";

const KIND_TABS: { label: string; value: IncubatorKind[] | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Incubators", value: [IncubatorKind.INCUBATOR] },
  { label: "Accelerators", value: [IncubatorKind.ACCELERATOR] },
];

/**
 * Incubators and accelerators, each card leading with what a founder looks
 * for first: whether a programme is taking applications, and until when.
 */
export default function IncubatorsDirectoryPage() {
  const [filters, setFilters] = useState<IncubatorSearchFilters>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState("");
  const { data, isLoading } = useIncubators(filters);
  const items = data?.items ?? [];
  const filtered = !!filters.query || !!filters.kind;

  // Search as the founder types, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => ({ ...current, query: search.trim() || undefined, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Incubators and accelerators"
        description="Programmes that take startups in. Each page shows when applications open, how long the programme runs and who can apply."
      />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <Input
            aria-label="Search incubators"
            placeholder="Search by name or focus"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
          {KIND_TABS.map((tab) => {
            const active = JSON.stringify(filters.kind) === JSON.stringify(tab.value);
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={active}
                onClick={() => setFilters({ ...filters, kind: tab.value, page: 1 })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand-primary bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                    : "border-border text-text-secondary hover:text-text-primary",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {!isLoading && (
        <p className="caption-5 -mt-4">
          {data?.totalItems ?? 0} {filtered ? "match" : "listed"}
        </p>
      )}

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((incubator) => {
            const next = sortProgrammes(incubator.programs)[0];
            const status = next ? programmeStatus(next) : null;
            return (
              <Link
                key={incubator.id}
                href={`/incubators/${incubator.id}`}
                className="group rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Card interactive className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={incubator.organizationName} src={incubator.logoUrl} size="md" className="rounded-button" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="title-3 truncate">{incubator.organizationName}</h3>
                        <VerifiedBadge status={incubator.verificationStatus} />
                      </div>
                      <p className="caption-5">
                        {KIND_LABEL[incubator.kind] ?? "Incubator"} ·{" "}
                        {incubator.programs.length === 1 ? "1 programme" : `${incubator.programs.length} programmes`}
                      </p>
                    </div>
                  </div>

                  {incubator.description && <p className="caption-2 line-clamp-2">{incubator.description}</p>}

                  {incubator.industries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {incubator.industries.slice(0, 3).map((industry) => (
                        <Badge key={industry} variant="brand">
                          {industryLabel(industry)}
                        </Badge>
                      ))}
                      {incubator.industries.length > 3 && <Badge variant="neutral">+{incubator.industries.length - 3} more</Badge>}
                    </div>
                  )}

                  {next && status && (
                    <div className="flex flex-col gap-1 rounded-button bg-background-secondary p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="body-5 truncate text-text-primary">{next.name}</span>
                        {status.state === "open" && <Badge variant="success">Open</Badge>}
                      </div>
                      <span className="flex items-center gap-1 caption-5">
                        <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {status.hint ?? status.label}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-end border-t border-border pt-4">
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-primary">
                      View programmes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={filtered ? "No incubators match that yet" : "No incubators listed yet"}
          description={
            filtered ? "Try another word, or clear the search to see every programme." : "Incubators and accelerators appear here as soon as they publish a profile."
          }
        />
      )}
    </div>
  );
}
