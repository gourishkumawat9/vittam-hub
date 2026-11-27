"use client";

import { useCurrentUser, useUniversity } from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, ErrorState, Skeleton } from "@vittamhub/ui";
import { ArrowRight, BookOpen, CheckCircle2, Globe, Lightbulb } from "@vittamhub/ui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/dashboard/FollowButton";
import { PanelTitle } from "@/components/dashboard/PageHeader";
import { externalHref } from "@/lib/safe-url";
import { INSTITUTION_TYPE_LABEL } from "@/lib/signup-options";

const NEXT_STEPS = [
  { href: "/mentors", label: "Find a mentor", hint: "Request a session with your question" },
  { href: "/incubators", label: "Browse incubators", hint: "Programmes with open calls and dates" },
  { href: "/community", label: "Join the community", hint: "Updates, events and polls from founders" },
];

/**
 * A university's campus page as founders see it: its startup cell, what
 * students can join, the departments behind it, and where to go next.
 */
export default function UniversityDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: university, isLoading, isError } = useUniversity(params.id);
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-card lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!university) return <p className="text-sm text-text-secondary">University not found.</p>;

  const isOwner = user?.id === university.ownerId;
  const website = university.website ? externalHref(university.website) : null;
  const cell = university.incubationCellName ?? "Startup cell";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={university.institutionName} src={university.logoUrl} size="lg" className="rounded-card" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="heading-5">{university.institutionName}</h1>
              <VerifiedBadge status={university.verificationStatus} />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 caption-2">
              <span>{cell}</span>
              {university.affiliationType && <Badge variant="neutral">{INSTITUTION_TYPE_LABEL[university.affiliationType] ?? university.affiliationType}</Badge>}
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
              <Link href="/onboarding/university">Edit profile</Link>
            </Button>
          ) : (
            <FollowButton userId={university.ownerId} />
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <PanelTitle icon={Lightbulb} title="What students can join" />
            {university.programsOffered.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {university.programsOffered.map((programme) => (
                  <li key={programme} className="flex items-start gap-3 rounded-button border border-border p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="body-5 pt-1.5 text-text-primary">{programme}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caption-2">No programmes listed yet. Follow them to hear when one is announced.</p>
            )}
          </Card>

          {university.departments.length > 0 && (
            <Card className="flex flex-col gap-4">
              <PanelTitle icon={BookOpen} title="Departments" />
              <div className="flex flex-wrap gap-2">
                {university.departments.map((department) => (
                  <Badge key={department} variant="brand">
                    {department}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-4">
            <h2 className="title-2">Join {cell}</h2>
            <ol className="flex flex-col gap-2">
              {[
                "Follow them to see campus events and calls in your feed",
                website ? "Their website has how to join the cell" : "Ask about joining when they post an event",
              ].map((step) => (
                <li key={step} className="flex items-start gap-2 caption-5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ol>
            {website && (
              <Button variant="secondary" className="w-full" asChild>
                <a href={website} target="_blank" rel="noopener noreferrer">
                  Visit their website
                </a>
              </Button>
            )}
            <div className="flex flex-col gap-1 border-t border-border pt-4">
              <p className="caption-4">Then, on VittamHub</p>
              <ul className="flex flex-col">
                {NEXT_STEPS.map((step) => (
                  <li key={step.href}>
                    <Link href={step.href} className="group flex items-center justify-between gap-3 py-2">
                      <span className="flex flex-col">
                        <span className="body-5 text-text-primary group-hover:text-brand-primary">{step.label}</span>
                        <span className="caption-5">{step.hint}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
