"use client";

import { useCurrentUser, usePublicFounderActivity, useRecordProfileView, useStartup } from "@vittamhub/api-client";
import { Badge, Button, Card, EmptyState, Skeleton, useToast } from "@vittamhub/ui";
import { Activity, BadgeCheck, Building2, CalendarDays, FileText, Globe, History, Link2, MapPin, Users } from "@vittamhub/ui/icons";
import { formatCompactMoney, formatRelativeTime } from "@vittamhub/utils";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { FollowButton } from "@/components/dashboard/FollowButton";
import { externalHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(url);
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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

const PRODUCT_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  PROTOTYPE: "Prototype",
  BETA: "In beta",
  LIVE: "Live",
  SCALED: "Scaled",
};

const REVENUE_LABEL: Record<string, string> = {
  NONE: "Pre-revenue",
  PILOT: "Paid pilots",
  FIRST_REVENUE: "First revenue",
  RECURRING: "Recurring revenue",
  PROFITABLE: "Profitable",
};

const FUNDING_LABEL: Record<string, string> = {
  BOOTSTRAPPED: "Bootstrapped",
  ANGEL: "Angel round",
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C_PLUS: "Series C or later",
  PE: "Private equity",
};

type StartupDetail = NonNullable<ReturnType<typeof useStartup>["data"]>;
type ActivityEntries = ReturnType<typeof usePublicFounderActivity>["data"];

function Section({ id, title, children, className }: { id?: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <h2 id={id} className="title-2">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="whitespace-pre-line body-6 text-text-secondary">{children}</p>;
}

/** One row of the key facts list; skipped when there is nothing to say. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="caption-4">{label}</dt>
      <dd className="text-right body-5 text-text-primary">{value}</dd>
    </div>
  );
}

function CopyLinkButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void navigator.clipboard
          .writeText(window.location.href)
          .then(() => toast({ variant: "success", title: "Link copied" }))
          .catch(() => toast({ variant: "error", title: "Couldn't copy the link", description: "Copy it from the address bar instead." }));
      }}
    >
      <Link2 className="h-4 w-4" aria-hidden="true" /> Copy link
    </Button>
  );
}

/**
 * A startup's public page, laid out like a company profile: a light cover,
 * the logo and name, then the story on the left and the key facts on the
 * right. Every section shows only what the founder has filled in.
 */
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
      <div className="flex flex-col">
        <Skeleton className="h-36 w-full rounded-none sm:h-44" />
        <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-6 py-10">
          <Skeleton className="h-24 w-96 max-w-full" />
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-72 w-full lg:col-span-8" />
            <Skeleton className="h-72 w-full lg:col-span-4" />
          </div>
        </div>
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

  const place = startup.headquarters ?? startup.location;
  const raised = Number(startup.fundingRaisedAmount) > 0 ? formatCompactMoney(Number(startup.fundingRaisedAmount), startup.currency) : null;
  const isVerified = startup.verificationStatus === "VERIFIED";

  return (
    <div className="flex flex-col pb-20">
      {/* Cover: the brand's light blue, never a photo standing in for the company. */}
      <div aria-hidden="true" className="relative h-32 overflow-hidden bg-gradient-to-r from-brand-100 via-brand-50 to-brand-200 dark:from-brand-950 dark:via-background-secondary dark:to-brand-900 sm:h-44">
        <div className="bg-grid-pattern absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      {/* Positioned so the logo and name sit on top of the cover, not under it. */}
      <div className="relative mx-auto w-full max-w-content px-6">
        <header className="-mt-10 flex flex-col gap-5 sm:-mt-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {startup.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, user-uploaded logo URL
              <img
                src={startup.logoUrl}
                alt={`${startup.name} logo`}
                className="h-20 w-20 shrink-0 rounded-card border-4 border-background bg-surface object-cover shadow-md sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-card border-4 border-background bg-brand-100 font-heading text-2xl font-bold text-brand-700 shadow-md dark:bg-brand-900 dark:text-brand-100 sm:h-24 sm:w-24">
                {startup.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1.5 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{startup.name}</h1>
                {isVerified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-brand-primary" aria-label="Verified" role="img" />
                )}
              </div>
              {startup.tagline && <p className="body-4 text-text-secondary">{startup.tagline}</p>}
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 caption-2">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden="true" /> {titleCase(startup.industry)}
                </span>
                {place && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> {place}
                  </span>
                )}
                {startup.foundedYear && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" /> Founded {startup.foundedYear}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" /> {startup.teamSize} {startup.teamSize === 1 ? "person" : "people"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FollowButton userId={startup.ownerId} />
            {startup.website && (
              <Button variant="secondary" size="sm" asChild>
                <a href={externalHref(startup.website)} target="_blank" rel="noreferrer">
                  <Globe className="h-4 w-4" aria-hidden="true" /> Website
                </a>
              </Button>
            )}
            <CopyLinkButton />
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
          {isVerified && <Badge variant="success">Verified</Badge>}
          {startup.isFundraising && <Badge variant="warning">Fundraising now</Badge>}
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            <StorySections startup={startup} />
            <TeamSection startup={startup} />
            <TimelineSection startup={startup} />
            <ActivitySection activity={activity} />
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4" aria-label="Key facts">
            <Card className="flex flex-col gap-4">
              <h2 className="title-2">Key facts</h2>
              <dl className="flex flex-col divide-y divide-border">
                <Fact label="Stage" value={STAGE_LABEL[startup.stage] ?? startup.stage} />
                <Fact label="Industry" value={titleCase(startup.industry)} />
                <Fact label="Product" value={startup.productStatus ? (PRODUCT_LABEL[startup.productStatus] ?? titleCase(startup.productStatus)) : null} />
                <Fact label="Revenue" value={startup.revenueStatus ? (REVENUE_LABEL[startup.revenueStatus] ?? titleCase(startup.revenueStatus)) : null} />
                <Fact label="Funding so far" value={startup.fundingStatus ? (FUNDING_LABEL[startup.fundingStatus] ?? titleCase(startup.fundingStatus)) : null} />
                <Fact label="Raised" value={raised} />
                <Fact label="Raising now" value={startup.isFundraising ? "Yes" : "No"} />
                <Fact label="Based in" value={place} />
                <Fact label="Founded" value={startup.foundedYear} />
                <Fact label="Team" value={`${startup.teamSize} ${startup.teamSize === 1 ? "person" : "people"}`} />
              </dl>
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="flex items-center gap-2 title-4">
                <BadgeCheck className={cn("h-4 w-4", isVerified ? "text-brand-primary" : "text-text-secondary")} aria-hidden="true" />
                {isVerified ? "Verified on VittamHub" : "Not verified yet"}
              </p>
              <p className="caption-5">
                {isVerified
                  ? "The details and documents a startup profile needs are in. Checks against government registries aren't automated yet."
                  : "This startup hasn't added every detail and document a verified profile needs yet."}
              </p>
              <p className="caption-5">Profile updated {formatRelativeTime(startup.updatedAt)}.</p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** What the startup does and why: the founder's own words, in the order an investor reads them. */
function StorySections({ startup }: { startup: StartupDetail }) {
  return (
    <>
      <Section title="About">
        <Prose>{startup.description}</Prose>
      </Section>

      {(startup.problemStatement || startup.solution) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {startup.problemStatement && (
            <Section title="The problem">
              <Prose>{startup.problemStatement}</Prose>
            </Section>
          )}
          {startup.solution && (
            <Section title="The solution">
              <Prose>{startup.solution}</Prose>
            </Section>
          )}
        </div>
      )}

      {startup.businessModelSummary && (
        <Section title="Business model">
          <Prose>{startup.businessModelSummary}</Prose>
        </Section>
      )}

      {(startup.mission || startup.vision) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {startup.mission && (
            <Section title="Mission">
              <Prose>{startup.mission}</Prose>
            </Section>
          )}
          {startup.vision && (
            <Section title="Vision">
              <Prose>{startup.vision}</Prose>
            </Section>
          )}
        </div>
      )}
    </>
  );
}

function TeamSection({ startup }: { startup: StartupDetail }) {
  if (startup.teamMembers.length === 0) return null;
  return (
    <Section title="Founders and team">
      <div className="grid gap-3 sm:grid-cols-2">
        {startup.teamMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-card border border-border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-100">
              {member.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate body-5 text-text-primary">{member.fullName}</p>
              <p className="truncate caption-5">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Dated milestones, newest first as the founder added them, with any evidence attached. */
function TimelineSection({ startup }: { startup: StartupDetail }) {
  return (
    <Section title="Milestones">
      {startup.milestones.length > 0 ? (
        <ol className="flex flex-col gap-5 border-l-2 border-border pl-5">
          {startup.milestones.map((milestone) => (
            <li key={milestone.id} className="relative flex flex-col gap-0.5">
              <span aria-hidden="true" className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-brand-primary" />
              <p className="caption-5">
                {new Date(milestone.achievedAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })} ·{" "}
                <span className="font-semibold uppercase tracking-wide text-brand-primary">{MILESTONE_LABEL[milestone.type] ?? milestone.type}</span>
              </p>
              <p className="body-5 text-text-primary">{milestone.title}</p>
              {milestone.description && <p className="caption-5">{milestone.description}</p>}
              {milestone.evidenceUrls.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {milestone.evidenceUrls.map((url) =>
                    isImageUrl(url) ? (
                      <a key={url} href={externalHref(url)} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, thumbnail only */}
                        <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
                      </a>
                    ) : (
                      <a
                        key={url}
                        href={externalHref(url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center gap-1 rounded-button border border-border px-2 text-xs text-text-secondary hover:text-brand-primary"
                      >
                        <FileText className="h-3 w-3" aria-hidden="true" /> Evidence
                      </a>
                    ),
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState icon={History} title="No milestones yet" description="Milestones this startup adds show here, with dates." className="py-6" />
      )}
    </Section>
  );
}

function ActivitySection({ activity }: { activity: ActivityEntries }) {
  if (!activity || activity.length === 0) return null;
  return (
    <Section title="Recent activity">
      <ul className="flex flex-col gap-3">
        {activity.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
              <div>
                <p className="body-5 text-text-primary">{entry.title}</p>
                {entry.description && <p className="caption-5">{entry.description}</p>}
              </div>
            </div>
            <span className="shrink-0 caption-5">{formatRelativeTime(entry.occurredAt)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
