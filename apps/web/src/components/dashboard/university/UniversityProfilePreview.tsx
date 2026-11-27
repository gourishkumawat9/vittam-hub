import type { UniversityWithOwner } from "@vittamhub/api-client";
import { Avatar, Badge, Card } from "@vittamhub/ui";
import { Circle, Eye } from "@vittamhub/ui/icons";
import Link from "next/link";

import { VerifiedBadge } from "@/components/VerifiedBadge";

import { PanelLink, PanelTitle } from "../PageHeader";

/** What's still missing from the campus page, each one a reason a student might not reach out. */
function missingFromPage(university: UniversityWithOwner) {
  const missing: string[] = [];
  if (!university.logoUrl) missing.push("Logo");
  if (!university.website) missing.push("Website");
  if (!university.incubationCellName) missing.push("Your startup cell's name");
  if (university.programsOffered.length === 0) missing.push("A programme for student founders");
  if (university.departments.length === 0) missing.push("Departments");
  return missing;
}

/** The campus card as student founders see it in the directory, and what would make it more complete. */
export function UniversityProfilePreview({ university }: { university: UniversityWithOwner }) {
  const missing = missingFromPage(university);

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Eye} title="How founders see you" />
      <div className="flex flex-col gap-3 rounded-button border border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={university.institutionName} src={university.logoUrl} size="md" className="rounded-button" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="title-3 truncate">{university.institutionName}</p>
              <VerifiedBadge status={university.verificationStatus} />
            </div>
            <p className="caption-5 truncate">{university.incubationCellName ?? "University"}</p>
          </div>
        </div>
        {university.departments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {university.departments.slice(0, 4).map((department) => (
              <Badge key={department} variant="brand">
                {department}
              </Badge>
            ))}
          </div>
        )}
        <p className="caption-5">
          {university.programsOffered.length === 1 ? "1 programme for founders" : `${university.programsOffered.length} programmes for founders`}
        </p>
      </div>

      {missing.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="caption-4">Add to your page</p>
          <ul className="flex flex-col gap-1.5">
            {missing.map((item) => (
              <li key={item}>
                <Link href="/onboarding/university" className="flex items-center gap-2 body-6 text-text-secondary transition-colors hover:text-brand-primary">
                  <Circle className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <PanelLink href={`/universities/${university.id}`}>View public page</PanelLink>
        <PanelLink href="/onboarding/university">Edit profile</PanelLink>
      </div>
    </Card>
  );
}
