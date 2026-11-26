"use client";

import { useCurrentUser, useIncubator } from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, ErrorState, Skeleton } from "@vittamhub/ui";
import { CheckCircle2, ExternalLink, Globe, Layers, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/dashboard/FollowButton";
import { PanelTitle } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { ProgrammeList } from "@/components/dashboard/incubator/ProgrammeList";
import { KIND_LABEL, industryLabel, openCallCount, programmeStatus, sortProgrammes } from "@/components/dashboard/incubator/programmes";
import { externalHref } from "@/lib/safe-url";

const HOW_TO_APPLY = [
  "Check the dates and who can apply for each programme",
  "Apply on the incubator's own site through its link",
  "Follow them to see open calls and demo days in your feed",
];

/**
 * An incubator's page as founders see it: who they are, their programmes with
 * the application window for each, the startups they've backed, and how to
 * apply.
 */
export default function IncubatorDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: incubator, isLoading, isError } = useIncubator(params.id);
  const { data: user } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-button" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-card lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!incubator) return <p className="text-sm text-text-secondary">Incubator not found.</p>;

  const isOwner = user?.id === incubator.ownerId;
  const openCalls = openCallCount(incubator.programs);
  const featured = sortProgrammes(incubator.programs)[0];
  const featuredStatus = featured ? programmeStatus(featured) : null;
  const featuredApply = featured?.applicationUrl ? externalHref(featured.applicationUrl) : null;
  const website = incubator.website ? externalHref(incubator.website) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={incubator.organizationName} src={incubator.logoUrl} size="lg" className="rounded-card" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="heading-5">{incubator.organizationName}</h1>
              <VerifiedBadge status={incubator.verificationStatus} />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 caption-2">
              <span>{KIND_LABEL[incubator.kind] ?? "Incubator"}</span>
              {openCalls > 0 && <Badge variant="success">Applications open</Badge>}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-primary hover:underline">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {new URL(website).hostname.replace(/^www\./, "")}
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOwner ? (
            <Button variant="secondary" asChild>
              <Link href="/onboarding/incubator">Edit profile</Link>
            </Button>
          ) : (
            <FollowButton userId={incubator.ownerId} />
          )}
        </div>
      </header>

      <StatStrip
        stats={[
          { label: "Programmes", value: incubator.programs.length },
          { label: "Taking applications", value: openCalls, hint: openCalls > 0 ? "Apply through each programme's link" : "None open right now" },
          { label: "Startups backed", value: incubator.portfolioCompanies.length, hint: "As listed by the incubator" },
          ...(incubator.affiliatedMentorCount != null
            ? [{ label: "Mentors", value: incubator.affiliatedMentorCount, hint: "In their own network" }]
            : []),
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {(incubator.description || incubator.industries.length > 0) && (
            <Card className="flex flex-col gap-4">
              <PanelTitle icon={Users} title="About" />
              {incubator.description && <p className="body-6 text-text-secondary">{incubator.description}</p>}
              {incubator.industries.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="caption-4">Industries they back</p>
                  <div className="flex flex-wrap gap-2">
                    {incubator.industries.map((industry) => (
                      <Badge key={industry} variant="brand">
                        {industryLabel(industry)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="flex flex-col gap-4">
            <PanelTitle icon={Layers} title="Programmes" />
            {incubator.programs.length > 0 ? (
              <ProgrammeList programmes={incubator.programs} viewer={isOwner ? "owner" : "founder"} />
            ) : (
              <p className="caption-2">No programmes listed yet. Follow them to hear when one opens.</p>
            )}
          </Card>

          {incubator.portfolioCompanies.length > 0 && (
            <Card className="flex flex-col gap-4">
              <PanelTitle icon={Rocket} title="Startups they've backed" />
              <ul className="flex flex-wrap gap-2">
                {incubator.portfolioCompanies.map((name) => (
                  <li key={name} className="rounded-button bg-background-secondary px-3 py-1.5 body-6 text-text-primary">
                    {name}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-4">
            <h2 className="title-2">How to apply</h2>
            {featured && featuredStatus ? (
              <div className="flex flex-col gap-1 rounded-button bg-background-secondary p-3">
                <p className="caption-4">{featuredStatus.state === "open" ? "Open now" : "Next programme"}</p>
                <p className="body-5 text-text-primary">{featured.name}</p>
                <p className="caption-5">{featuredStatus.hint ?? featuredStatus.label}</p>
              </div>
            ) : (
              <p className="caption-2">No programmes listed yet.</p>
            )}
            {featuredApply && featuredStatus?.state === "open" && (
              <Button className="w-full" asChild>
                <a href={featuredApply} target="_blank" rel="noopener noreferrer">
                  Apply on their site <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            )}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <ol className="flex flex-col gap-2">
                {HOW_TO_APPLY.map((step) => (
                  <li key={step} className="flex items-start gap-2 caption-5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
