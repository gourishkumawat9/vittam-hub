"use client";

import { useCurrentUser, usePublicFounderActivity, useRecordProfileView, useStartup } from "@vittamhub/api-client";
import { Badge, Card, EmptyState, Skeleton } from "@vittamhub/ui";
import { formatCompactUsd, formatRelativeTime } from "@vittamhub/utils";
import { Activity, Building2, FileText, Globe, History, MapPin, Sparkles, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { FollowButton } from "@/components/dashboard/FollowButton";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(url);
}

const STAGE_LABEL: Record<string, string> = {
  IDEA: "Idea",
  VALIDATION: "Validation",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  CUSTOMERS: "Early customers",
  REVENUE: "Revenue",
  FUNDED: "Funded",
  SCALING: "Scaling",
  UNICORN: "Unicorn",
};

const MILESTONE_LABEL: Record<string, string> = {
  IDEA_CREATED: "Idea created",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  FIRST_CUSTOMER: "First customer",
  REVENUE: "Revenue",
  SEED_ROUND: "Seed round",
  AWARD: "Award",
  HIRING: "Hiring",
  PRODUCT_LAUNCH: "Product launch",
  OTHER: "Milestone",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-base font-semibold text-text-primary">{title}</h2>
      {children}
    </Card>
  );
}

export default function StartupProfilePage() {
  const params = useParams<{ slug: string }>();
  const { data: startup, isLoading, isError } = useStartup(params.slug);
  const { data: activity } = usePublicFounderActivity(params.slug);
  const { data: user } = useCurrentUser();
  const recordView = useRecordProfileView();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (!startup || user?.role !== "INVESTOR" || hasRecordedView.current) return;
    hasRecordedView.current = true;
    recordView.mutate(params.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount, not on every recordView identity change
  }, [startup, user?.role, params.slug]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-content flex-col gap-6 px-6 py-16">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !startup) {
    return (
      <div className="mx-auto max-w-content px-6 py-16">
        <EmptyState icon={Building2} title="Startup not found" description="This profile doesn't exist or isn't public." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-6 px-6 py-16">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {startup.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, user-uploaded logo URL
            <img src={startup.logoUrl} alt={`${startup.name} logo`} className="h-16 w-16 rounded-card object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-brand-100 font-heading text-lg font-bold text-brand-700">
              {startup.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">{startup.name}</h1>
            <p className="text-text-secondary">{startup.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
          {startup.verificationStatus === "VERIFIED" && <Badge variant="success">Verified</Badge>}
          {startup.isFundraising && <Badge variant="warning">Fundraising</Badge>}
          <FollowButton userId={startup.ownerId} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" /> {startup.industry}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {startup.headquarters ?? startup.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {startup.teamSize} people
        </span>
        {startup.website && (
          <a href={startup.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-primary hover:underline">
            <Globe className="h-4 w-4" /> Website
          </a>
        )}
        {Number(startup.fundingRaisedUsd) > 0 && (
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> {formatCompactUsd(Number(startup.fundingRaisedUsd))} raised
          </span>
        )}
      </div>

      <Section title="Overview">
        <p className="whitespace-pre-line text-sm text-text-secondary">{startup.description}</p>
      </Section>

      {(startup.mission || startup.vision) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {startup.mission && (
            <Section title="Mission">
              <p className="text-sm text-text-secondary">{startup.mission}</p>
            </Section>
          )}
          {startup.vision && (
            <Section title="Vision">
              <p className="text-sm text-text-secondary">{startup.vision}</p>
            </Section>
          )}
        </div>
      )}

      {(startup.problemStatement || startup.solution) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {startup.problemStatement && (
            <Section title="Problem">
              <p className="text-sm text-text-secondary">{startup.problemStatement}</p>
            </Section>
          )}
          {startup.solution && (
            <Section title="Solution">
              <p className="text-sm text-text-secondary">{startup.solution}</p>
            </Section>
          )}
        </div>
      )}

      {startup.businessModelSummary && (
        <Section title="Business Model">
          <p className="text-sm text-text-secondary">{startup.businessModelSummary}</p>
        </Section>
      )}

      {startup.teamMembers.length > 0 && (
        <Section title="Founders & Team">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startup.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-card border border-border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-xs font-bold text-brand-700">
                  {member.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{member.fullName}</p>
                  <p className="truncate text-xs text-text-secondary">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {startup.milestones.length > 0 && (
        <Section title="Timeline">
          <div className="flex flex-col gap-4 border-l-2 border-border pl-4">
            {startup.milestones.map((milestone) => (
              <div key={milestone.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-primary" />
                <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
                  {MILESTONE_LABEL[milestone.type] ?? milestone.type}
                </p>
                <p className="text-sm font-semibold text-text-primary">{milestone.title}</p>
                {milestone.description && <p className="text-xs text-text-secondary">{milestone.description}</p>}
                {milestone.evidenceUrls.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {milestone.evidenceUrls.map((url) =>
                      isImageUrl(url) ? (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, thumbnail only */}
                          <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
                        </a>
                      ) : (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 items-center gap-1 rounded-button border border-border px-2 text-xs text-text-secondary hover:text-brand-primary"
                        >
                          <FileText className="h-3 w-3" /> Evidence
                        </a>
                      ),
                    )}
                  </div>
                )}
                <p className="mt-0.5 text-xs text-text-secondary">
                  {new Date(milestone.achievedAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {startup.milestones.length === 0 && (
        <EmptyState icon={History} title="No timeline yet" description="This startup hasn't added any milestones." />
      )}

      {activity && activity.length > 0 && (
        <Section title="Recent Activity">
          <ul className="flex flex-col gap-3">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
                  <div>
                    <p className="font-medium text-text-primary">{entry.title}</p>
                    {entry.description && <p className="text-xs text-text-secondary">{entry.description}</p>}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(entry.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
