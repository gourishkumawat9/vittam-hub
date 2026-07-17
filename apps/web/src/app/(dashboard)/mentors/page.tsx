"use client";

import { useMentors } from "@vittamhub/api-client";
import type { MentorSearchFilters } from "@vittamhub/types";
import { Badge, Card, EmptyState, TagsInput } from "@vittamhub/ui";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

export default function MentorsDirectoryPage() {
  const [filters, setFilters] = useState<MentorSearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useMentors(filters);
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Mentors</h1>
        <p className="text-sm text-text-secondary">Browse vetted mentors by expertise and book a session.</p>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <TagsInput
          label="Expertise"
          value={filters.expertise ?? []}
          onChange={(expertise) => setFilters({ ...filters, expertise, page: 1 })}
          placeholder="e.g. Fundraising, Growth…"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((mentor) => (
            <Link key={mentor.id} href={`/mentors/${mentor.id}`}>
              <Card interactive className="flex h-full flex-col gap-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{mentor.owner.fullName}</h3>
                  <p className="text-xs text-text-secondary">{mentor.headline ?? "Mentor"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="brand">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="mt-auto text-xs text-text-secondary">
                  {mentor.yearsExperience != null ? `${mentor.yearsExperience} years experience` : "Experience not listed"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="No mentors listed yet" description="Check back soon as mentors join VittamHub." />
      )}
    </div>
  );
}
