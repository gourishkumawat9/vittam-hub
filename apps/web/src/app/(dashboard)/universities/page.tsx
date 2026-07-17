"use client";

import { useUniversities } from "@vittamhub/api-client";
import type { UniversitySearchFilters } from "@vittamhub/types";
import { Badge, Card, EmptyState, TagsInput } from "@vittamhub/ui";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

export default function UniversitiesDirectoryPage() {
  const [filters, setFilters] = useState<UniversitySearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useUniversities(filters);
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Universities</h1>
        <p className="text-sm text-text-secondary">Browse university incubation cells and their programs.</p>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <TagsInput
          label="Departments"
          value={filters.departments ?? []}
          onChange={(departments) => setFilters({ ...filters, departments, page: 1 })}
          placeholder="e.g. Computer Science…"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((university) => (
            <Link key={university.id} href={`/universities/${university.id}`}>
              <Card interactive className="flex h-full flex-col gap-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{university.institutionName}</h3>
                  <p className="text-xs text-text-secondary">{university.incubationCellName ?? university.affiliationType ?? "University"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {university.departments.slice(0, 4).map((department) => (
                    <Badge key={department} variant="brand">
                      {department}
                    </Badge>
                  ))}
                </div>
                <p className="mt-auto text-xs text-text-secondary">{university.programsOffered.length} program(s) offered</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="No universities listed yet" description="Check back soon as universities join VittamHub." />
      )}
    </div>
  );
}
