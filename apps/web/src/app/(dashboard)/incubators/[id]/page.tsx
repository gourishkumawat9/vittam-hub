"use client";

import { useIncubator } from "@vittamhub/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@vittamhub/ui";
import { useParams } from "next/navigation";

import { FollowButton } from "@/components/dashboard/FollowButton";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function IncubatorDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: incubator, isLoading } = useIncubator(params.id);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!incubator) return <p className="text-sm text-text-secondary">Incubator not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">{incubator.organizationName}</h1>
          {incubator.description && <p className="mt-1 text-sm text-text-secondary">{incubator.description}</p>}
        </div>
        <FollowButton userId={incubator.ownerId} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {incubator.industries.map((industry) => (
          <Badge key={industry} variant="brand">
            {industry}
          </Badge>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-text-primary">Programs</h2>
        {incubator.programs.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No programs listed yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {incubator.programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <CardTitle>{program.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-text-secondary">
                  {program.description && <p>{program.description}</p>}
                  {program.durationWeeks != null && <p>Duration: {program.durationWeeks} weeks</p>}
                  {(program.applicationCycleStart || program.applicationCycleEnd) && (
                    <p>
                      Applications: {formatDate(program.applicationCycleStart) ?? "—"} – {formatDate(program.applicationCycleEnd) ?? "—"}
                    </p>
                  )}
                  {program.eligibilityCriteria && <p>Eligibility: {program.eligibilityCriteria}</p>}
                  {program.applicationUrl && (
                    <a
                      href={program.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 font-semibold text-brand-primary hover:underline"
                    >
                      Apply on {new URL(program.applicationUrl).hostname}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
