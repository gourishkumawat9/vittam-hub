"use client";

import { useUniversity } from "@vittamhub/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle, ErrorState, Skeleton } from "@vittamhub/ui";
import { useParams } from "next/navigation";

export default function UniversityDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: university, isLoading, isError } = useUniversity(params.id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-card" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!university) return <p className="text-sm text-text-secondary">University not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {university.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL
          <img src={university.logoUrl} alt="" className="h-14 w-14 rounded-card object-cover" />
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">{university.institutionName}</h1>
          {university.incubationCellName && <p className="text-sm text-text-secondary">{university.incubationCellName}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {university.departments.map((department) => (
          <Badge key={department} variant="brand">
            {department}
          </Badge>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader className="pb-0">
          <CardTitle>Programs offered</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-text-secondary">
          {university.programsOffered.length === 0 ? (
            <p>No programs listed yet.</p>
          ) : (
            <ul className="list-inside list-disc">
              {university.programsOffered.map((program) => (
                <li key={program}>{program}</li>
              ))}
            </ul>
          )}
          {university.website && (
            <a href={university.website} target="_blank" rel="noreferrer" className="mt-2 font-semibold text-brand-primary hover:underline">
              Visit website
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
