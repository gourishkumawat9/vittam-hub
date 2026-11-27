"use client";

import { useFollowStartup, useInvestorRecommendations, useMyInvestorProfile, useWatchlist } from "@vittamhub/api-client";
import type { Startup } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState } from "@vittamhub/ui";
import { Activity, Bookmark, BookmarkCheck, Compass, MapPin, PieChart, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader, PanelTitle, SectionHeader } from "@/components/dashboard/PageHeader";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";

/** A suggested startup: who it is, where it stands, and one press to save it to the watchlist. */
function StartupCard({ startup, saved }: { startup: Startup; saved: boolean }) {
  const follow = useFollowStartup();
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar name={startup.name} src={startup.logoUrl} size="md" className="rounded-button" />
        <div className="min-w-0 flex-1">
          <Link href={`/startups/${startup.slug}`} className="title-3 block truncate hover:text-brand-primary">
            {startup.name}
          </Link>
          <p className="caption-5 line-clamp-2">{startup.tagline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
        <Badge variant="neutral">{INDUSTRY_LABEL[startup.industry] ?? startup.industry}</Badge>
        {startup.isFundraising && <Badge variant="success">Raising</Badge>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="caption-5 flex min-w-0 items-center gap-1">
          {startup.location && (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{startup.location}</span>
            </>
          )}
        </span>
        <Button
          size="sm"
          variant={saved ? "ghost" : "secondary"}
          disabled={saved}
          isLoading={follow.isPending}
          onClick={() => follow.mutate({ startupId: startup.id, notifyOnUpdate: false })}
        >
          {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </Card>
  );
}

function Shelf({
  id,
  icon: Icon,
  title,
  why,
  startups,
  savedIds,
}: {
  id: string;
  icon: typeof Sparkles;
  title: string;
  why: string;
  startups: Startup[];
  savedIds: Set<string>;
}) {
  if (startups.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-brand-50 text-brand-primary dark:bg-brand-950">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <SectionHeader id={`${id}-heading`} title={title} description={why} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
        {startups.map((startup) => (
          <StartupCard key={startup.id} startup={startup} saved={savedIds.has(startup.id)} />
        ))}
      </div>
    </section>
  );
}

function CountList({
  title,
  icon,
  rows,
  hint,
  empty,
}: {
  title: string;
  icon: typeof Sparkles;
  rows: { label: string; count: number }[];
  hint: string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={icon} title={title} />
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.label} className="grid grid-cols-[minmax(0,8rem)_1fr_1.5rem] items-center gap-3 text-sm">
              <span className="truncate text-text-secondary">{row.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-background-secondary">
                <span className="block h-full rounded-full bg-brand-primary" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="text-right font-numeric font-semibold text-text-primary">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="caption-5">{empty}</p>
      )}
      {rows.length > 0 && <p className="caption-5">{hint}</p>}
    </Card>
  );
}

export default function RecommendationsPage() {
  const { data, isLoading, isError } = useInvestorRecommendations();
  const { data: profile } = useMyInvestorProfile();
  const { data: watchlist } = useWatchlist();
  const savedIds = new Set((watchlist ?? []).map((follow) => follow.startupId));
  const hasIndustries = (profile?.preferredIndustries?.length ?? 0) > 0;

  const header = (
    <PageHeader
      title="Recommendations"
      description="Startups picked by plain rules, not a model: the industries on your profile, the growth founders report, your portfolio and recent activity. Each list says why it's there."
      actions={
        <Button size="sm" asChild>
          <Link href="/investor/discover">
            <Compass className="h-4 w-4" aria-hidden="true" /> Discover startups
          </Link>
        </Button>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <CardGridSkeleton />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <ErrorState />
      </div>
    );
  }

  const nothing =
    data.highPotentialStartups.length +
      data.fastestGrowingCompanies.length +
      data.similarToPreviousInvestments.length +
      data.recentlyActiveFounders.length +
      data.recentlyVerifiedStartups.length ===
    0;

  return (
    <div className="flex flex-col gap-8">
      {header}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-10">
          {nothing ? (
            <EmptyState icon={Sparkles} title="Nothing to suggest yet" description="Suggestions come from startups' profiles and activity. As founders publish profiles, they show here." />
          ) : (
            <>
              <Shelf
                id="industries"
                icon={Target}
                title={hasIndustries ? "In your industries" : "Startups to look at"}
                why={
                  hasIndustries
                    ? "In the industries on your profile, verified profiles first, then the most recently updated."
                    : "Verified profiles first, then the most recently updated. Add industries to your profile to narrow this."
                }
                startups={data.highPotentialStartups}
                savedIds={savedIds}
              />
              <Shelf
                id="growing"
                icon={TrendingUp}
                title="Growing fastest"
                why="The highest growth rates founders have shared. Startups that keep their numbers private aren't ranked."
                startups={data.fastestGrowingCompanies}
                savedIds={savedIds}
              />
              <Shelf
                id="similar"
                icon={PieChart}
                title="Like your investments"
                why="In the same industries as the startups in your portfolio."
                startups={data.similarToPreviousInvestments}
                savedIds={savedIds}
              />
              <Shelf
                id="active"
                icon={Activity}
                title="Recently active"
                why="Posted a milestone or an update in the last two weeks."
                startups={data.recentlyActiveFounders}
                savedIds={savedIds}
              />
              <Shelf
                id="verified"
                icon={ShieldCheck}
                title="Newly verified"
                why="Recently added the documents and details the Verified badge asks for."
                startups={data.recentlyVerifiedStartups}
                savedIds={savedIds}
              />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24" aria-label="Where startups are raising">
          <CountList
            title="Raising now, by industry"
            icon={TrendingUp}
            rows={data.trendingIndustries.map((row) => ({ label: INDUSTRY_LABEL[row.industry] ?? row.industry, count: row.count }))}
            hint="Among the six startups that most recently opened a round."
            empty="No startup has opened a round yet."
          />
          <CountList
            title="Raising now, by city"
            icon={MapPin}
            rows={data.emergingMarkets.map((row) => ({ label: row.location, count: row.count }))}
            hint="Among the six startups that most recently opened a round."
            empty="No startup has opened a round yet."
          />
          {data.similarToPreviousInvestments.length === 0 && (
            <Card className="flex flex-col gap-2 bg-background-secondary">
              <p className="body-5 text-text-primary">Want suggestions like your portfolio?</p>
              <p className="caption-5">Record your investments in Portfolio and startups in the same industries show up here.</p>
              <Link href="/investor/portfolio" className="caption-4 text-brand-primary hover:underline">
                Open portfolio
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
