"use client";

import { useUniversities } from "@vittamhub/api-client";
import type { UniversitySearchFilters } from "@vittamhub/types";
import { Avatar, Badge, Card, EmptyState, Input } from "@vittamhub/ui";
import { ArrowRight, Lightbulb, School, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { INSTITUTION_TYPE_LABEL } from "@/lib/signup-options";

/**
 * Campus startup cells: each card says which cell it is, the departments
 * behind it, and what students can join.
 */
export default function UniversitiesDirectoryPage() {
  const [filters, setFilters] = useState<UniversitySearchFilters>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUniversities(filters);
  const items = data?.items ?? [];
  const filtered = !!filters.query;

  // Search as the visitor types, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => ({ ...current, query: search.trim() || undefined, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Universities"
        description="Campus startup cells and E-cells: the programmes they run for student founders, and the departments behind them."
      />

      <div className="flex flex-col gap-2">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <Input
            aria-label="Search universities"
            placeholder="Search by university or startup cell"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!isLoading && (
        <p className="caption-5 -mt-6">
          {data?.totalItems ?? 0} {filtered ? "match" : "listed"}
        </p>
      )}

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((university) => (
            <Link
              key={university.id}
              href={`/universities/${university.id}`}
              className="group rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Card interactive className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={university.institutionName} src={university.logoUrl} size="md" className="rounded-button" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="title-3 truncate">{university.institutionName}</h3>
                      <VerifiedBadge status={university.verificationStatus} />
                    </div>
                    <p className="caption-5 line-clamp-2">
                      {[university.incubationCellName, university.affiliationType && (INSTITUTION_TYPE_LABEL[university.affiliationType] ?? university.affiliationType)]
                        .filter(Boolean)
                        .join(" · ") || "University"}
                    </p>
                  </div>
                </div>

                {university.departments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {university.departments.slice(0, 3).map((department) => (
                      <Badge key={department} variant="brand">
                        {department}
                      </Badge>
                    ))}
                    {university.departments.length > 3 && <Badge variant="neutral">+{university.departments.length - 3} more</Badge>}
                  </div>
                )}

                {university.programsOffered.length > 0 && (
                  <ul className="flex flex-col gap-1.5 rounded-button bg-background-secondary p-3">
                    {university.programsOffered.slice(0, 2).map((programme) => (
                      <li key={programme} className="flex items-center gap-2 body-6 text-text-primary">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                        <span className="truncate">{programme}</span>
                      </li>
                    ))}
                    {university.programsOffered.length > 2 && (
                      <li className="caption-5 pl-5">+{university.programsOffered.length - 2} more</li>
                    )}
                  </ul>
                )}

                <div className="mt-auto flex items-center justify-end border-t border-border pt-4">
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand-primary">
                    View campus page <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={School}
          title={filtered ? "No universities match that yet" : "No universities listed yet"}
          description={filtered ? "Try another word, or clear the search to see every campus." : "Universities appear here as soon as they publish a profile."}
        />
      )}
    </div>
  );
}
