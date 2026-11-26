import type { IncubatorWithPrograms } from "@vittamhub/api-client";
import { Avatar, Badge, Card } from "@vittamhub/ui";
import { Circle, Eye } from "lucide-react";
import Link from "next/link";

import { VerifiedBadge } from "@/components/VerifiedBadge";

import { PanelLink, PanelTitle } from "../PageHeader";

import { KIND_LABEL, industryLabel, openCallCount, programmeStatus } from "./programmes";

/** What's still missing from the public page, each one a reason a founder might not apply. */
function missingFromPage(incubator: IncubatorWithPrograms) {
  const missing: string[] = [];
  if (!incubator.logoUrl) missing.push("Logo");
  if (!incubator.website) missing.push("Website");
  if (!incubator.description) missing.push("A short description");
  if (incubator.programs.length === 0) missing.push("A programme");
  else if (incubator.programs.every((programme) => programmeStatus(programme).state === "undated")) missing.push("Application dates");
  if (incubator.programs.some((programme) => programmeStatus(programme).state === "open" && !programme.applicationUrl)) {
    missing.push("An application link for your open call");
  }
  if (incubator.portfolioCompanies.length === 0) missing.push("Startups you've backed");
  return missing;
}

/** The incubator's card as founders see it in the directory, and what would make it more complete. */
export function IncubatorProfilePreview({ incubator }: { incubator: IncubatorWithPrograms }) {
  const openCalls = openCallCount(incubator.programs);
  const missing = missingFromPage(incubator);

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Eye} title="How founders see you" />
      <div className="flex flex-col gap-3 rounded-button border border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={incubator.organizationName} src={incubator.logoUrl} size="md" className="rounded-button" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="title-3 truncate">{incubator.organizationName}</p>
              <VerifiedBadge status={incubator.verificationStatus} />
            </div>
            <p className="caption-5">
              {KIND_LABEL[incubator.kind] ?? "Incubator"} · {incubator.programs.length === 1 ? "1 programme" : `${incubator.programs.length} programmes`}
            </p>
          </div>
        </div>
        {openCalls > 0 && <Badge variant="success" className="w-fit">Applications open</Badge>}
        {incubator.description && <p className="caption-2 line-clamp-3">{incubator.description}</p>}
        {incubator.industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {incubator.industries.slice(0, 4).map((industry) => (
              <Badge key={industry} variant="brand">
                {industryLabel(industry)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {missing.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="caption-4">Add to your page</p>
          <ul className="flex flex-col gap-1.5">
            {missing.map((item) => (
              <li key={item}>
                <Link href="/onboarding/incubator" className="flex items-center gap-2 body-6 text-text-secondary transition-colors hover:text-brand-primary">
                  <Circle className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <PanelLink href={`/incubators/${incubator.id}`}>View public page</PanelLink>
        <PanelLink href="/onboarding/incubator">Edit profile</PanelLink>
      </div>
    </Card>
  );
}
