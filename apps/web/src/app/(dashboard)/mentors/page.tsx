"use client";

import { useMentors } from "@vittamhub/api-client";
import type { MentorSearchFilters } from "@vittamhub/types";
import { Avatar, Badge, Card, EmptyState, TagsInput } from "@vittamhub/ui";
import { ArrowRight, GraduationCap, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";

/**
 * Every listed mentor, searchable by expertise. Each card says who they are,
 * what they help with, and how their sessions are priced, and opens their
 * profile to request a session.
 */
export default function MentorsDirectoryPage() {
  const [filters, setFilters] = useState<MentorSearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useMentors(filters);
  const items = data?.items ?? [];
  const filtered = (filters.expertise?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mentors"
        description="Search by expertise and request a session with your question. A mentor sets the time once they accept."
      />

      <Card className="flex flex-col gap-2">
        <TagsInput
          label="Search by expertise"
          value={filters.expertise ?? []}
          onChange={(expertise) => setFilters({ ...filters, expertise, page: 1 })}
          placeholder="e.g. Fundraising, Pricing, Growth…"
        />
        {!isLoading && (
          <p className="caption-5">
            {items.length === 1 ? "1 mentor" : `${items.length} mentors`}
            {filtered ? " match" : " listed"}
          </p>
        )}
      </Card>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((mentor) => (
            <Link key={mentor.id} href={`/mentors/${mentor.id}`} className="group rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              <Card interactive className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={mentor.owner.fullName} src={mentor.owner.avatarUrl} size="md" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="title-3 truncate">{mentor.owner.fullName}</h3>
                      <VerifiedBadge status={mentor.verificationStatus} />
                    </div>
                    <p className="caption-5 line-clamp-2">{mentor.headline ?? "Mentor"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="brand">
                      {skill}
                    </Badge>
                  ))}
                  {mentor.expertise.length > 4 && <Badge variant="neutral">+{mentor.expertise.length - 4} more</Badge>}
                </div>

                <dl className="grid grid-cols-3 gap-2 rounded-button bg-background-secondary p-3">
                  <div className="flex flex-col gap-0.5">
                    <dt className="caption-5">Experience</dt>
                    <dd className="body-5 text-text-primary">{mentor.yearsExperience != null ? `${mentor.yearsExperience} yrs` : "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="caption-5">Sessions</dt>
                    <dd className="body-5 text-text-primary">{mentor.reputation?.sessionsCompleted ?? 0}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="caption-5">Rating</dt>
                    <dd className="flex items-center gap-1 body-5 text-text-primary">
                      {mentor.reputation?.averageRating != null ? (
                        <>
                          <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" aria-hidden="true" />
                          {mentor.reputation.averageRating.toFixed(1)}
                        </>
                      ) : (
                        "New"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="caption-5 truncate">{mentor.pricingModel ?? "Pricing not listed"}</span>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-primary">
                    View profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title={filtered ? "No mentors match that yet" : "No mentors listed yet"}
          description={filtered ? "Try a broader skill, or clear the search to see everyone." : "Mentors appear here as soon as they publish a profile."}
        />
      )}
    </div>
  );
}
