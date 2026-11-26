"use client";

import {
  useConnections,
  useCurrentUser,
  useInvestorRecommendations,
  useMyInvestorProfile,
  useMyMeetings,
  usePortfolio,
  useWatchlist,
  useWorkspaceHome,
} from "@vittamhub/api-client";
import { Badge, Button, Card, ProgressBar, Skeleton } from "@vittamhub/ui";
import { CalendarClock, Gauge, Inbox, ShieldCheck, TrendingUp, UserCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader, PanelLink, PanelTitle, SectionHeader } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { PendingRequestCard } from "@/components/dashboard/investor/PendingRequestCard";
import { INDUSTRY_LABEL, labelFor } from "@/lib/startup-options";

const DAY = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });
const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function computeProfileCompletion(investor: ReturnType<typeof useMyInvestorProfile>["data"]) {
  if (!investor) return 0;
  const checks = [
    !!investor.bio,
    !!investor.investmentThesis,
    investor.preferredIndustries.length > 0,
    investor.preferredStages.length > 0,
    Number(investor.checkSizeMaxAmount) > 0,
    investor.portfolioCompanies.length > 0,
    !!investor.website,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * The investor's home, action first: the founders waiting for an answer come
 * before anything else, then this week's meetings and today's best matches,
 * and the market signals last. Search and quick links live in the sidebar
 * and the top bar, so they are not repeated here.
 */
export default function InvestorDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: pendingResult, isLoading: pendingLoading } = useConnections({ status: ["PENDING"], page: 1, pageSize: 20 });
  const { data: watchlist } = useWatchlist();
  const { data: portfolio } = usePortfolio();
  const { data: meetings } = useMyMeetings();
  const { data: recommendations } = useInvestorRecommendations();
  const { data: investorProfile } = useMyInvestorProfile();
  const { data: home, isLoading: homeLoading } = useWorkspaceHome();

  const pending = [...(pendingResult?.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const pendingTotal = pendingResult?.totalItems ?? pending.length;
  const savedCount = (watchlist ?? []).filter((follow) => !follow.notifyOnUpdate).length;
  const now = Date.now();
  const thisWeek = (meetings ?? [])
    .filter((meeting) => {
      const at = new Date(meeting.scheduledAt).getTime();
      return at > now && at - now <= WEEK_MS;
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const meetingsByDay = new Map<string, typeof thisWeek>();
  for (const meeting of thisWeek) {
    const key = DAY.format(new Date(meeting.scheduledAt));
    meetingsByDay.set(key, [...(meetingsByDay.get(key) ?? []), meeting]);
  }
  const profileCompletion = computeProfileCompletion(investorProfile);
  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Deal flow"}
        description={
          pendingLoading
            ? " "
            : pendingTotal > 0
              ? `${pendingTotal} founder${pendingTotal === 1 ? " is" : "s are"} waiting for your answer.`
              : "No requests waiting. Your best matches for today are below."
        }
        meta={
          home ? (
            <Badge variant={home.header.currentlyDeployingCapital ? "success" : "neutral"}>
              {home.header.currentlyDeployingCapital ? "Deploying capital" : "Not deploying right now"}
            </Badge>
          ) : undefined
        }
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/investor/profile">Edit thesis</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/investor/discover">Discover startups</Link>
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[
          {
            label: "Requests waiting",
            value: pendingLoading ? "…" : pendingTotal,
            hint: pendingTotal > 0 ? "Oldest first below" : "You're all caught up",
            href: "/investor/requests",
          },
          { label: "Meetings this week", value: meetings ? thisWeek.length : "…", hint: "Proposed and confirmed", href: "/investor/meetings" },
          { label: "Saved startups", value: watchlist ? savedCount : "…", hint: "On your watchlist", href: "/investor/watchlist?tab=saved" },
          { label: "Portfolio", value: portfolio ? portfolio.length : "…", hint: "Companies you track", href: "/investor/portfolio" },
        ]}
      />

      <section className="flex flex-col gap-4" aria-labelledby="reply-heading">
        <SectionHeader
          id="reply-heading"
          title="Needs your reply"
          description="Accepting opens chat, documents and meetings with the founder. Declining lets them know kindly."
          href={pendingTotal > 2 ? "/investor/requests" : undefined}
          linkLabel={`All ${pendingTotal} requests`}
        />
        {pendingLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : pending.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pending.slice(0, 2).map((connection) => (
              <PendingRequestCard key={connection.id} connection={connection} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-card border border-dashed border-border px-6 py-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-background-secondary">
              <Inbox className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </span>
            <div>
              <p className="body-5 text-text-primary">No requests waiting</p>
              <p className="caption-5">When a founder sends a connect request, it shows up here first with their ask and deck.</p>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="matches-heading">
        <SectionHeader
          id="matches-heading"
          title="Best matches today"
          description="Startups that fit your mandates, scored on stage, industry and ticket size."
          href="/investor/discover"
          linkLabel="Discover more"
        />
        {homeLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : home && home.bestMatchesToday.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.bestMatchesToday.slice(0, 4).map((match) => (
              <Link
                key={match.startupId}
                href={`/startups/${match.startup.slug}`}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 transition-colors duration-300 ease-base hover:border-brand-300"
              >
                <span className="title-4 truncate">{match.startup.name}</span>
                <span className="caption-5">{labelFor(INDUSTRY_LABEL, match.startup.industry)}</span>
                <Badge variant="brand" className="font-numeric mt-auto w-fit">
                  {match.score}% match
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-start gap-3">
            <p className="body-5 text-text-primary">No matches yet</p>
            <p className="caption-5 max-w-xl">
              Matches come from your mandates. Add one with the stages, industries and ticket size you invest in, and the best fits
              show up here every day.
            </p>
            <PanelLink href="/investor/mandates">Set up a mandate</PanelLink>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <PanelTitle icon={CalendarClock} title="This week" right={<PanelLink href="/investor/meetings">All meetings</PanelLink>} />
          {meetingsByDay.size > 0 ? (
            <div className="flex flex-col gap-4">
              {Array.from(meetingsByDay.entries()).map(([day, dayMeetings]) => (
                <div key={day} className="flex flex-col gap-2">
                  <p className="caption-5 font-semibold">{day}</p>
                  <ul className="flex flex-col divide-y divide-border rounded-button border border-border">
                    {dayMeetings.map((meeting) => (
                      <li key={meeting.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="body-6 truncate text-text-primary">
                          {meeting.connection.startup?.name ?? meeting.connection.requester.fullName}
                        </span>
                        <span className="font-numeric caption-5 shrink-0">{TIME.format(new Date(meeting.scheduledAt))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="caption-5">No meetings in the next seven days. Meetings you propose to founders you have accepted show up here.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-5">
          <PanelTitle icon={Gauge} title="Your standing" />
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <dt className="caption-5">Trust score</dt>
              <dd className="font-numeric heading-6">{home?.header.trustScore ?? "None yet"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="caption-5">Reply rate</dt>
              <dd className="font-numeric heading-6">
                {home?.header.responseRate != null ? `${Math.round(home.header.responseRate * 100)}%` : "None yet"}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="caption-5">Typical reply time</dt>
              <dd className="font-numeric heading-6">
                {home?.header.avgResponseTimeHours != null ? `${Math.round(home.header.avgResponseTimeHours)} h` : "None yet"}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="caption-5">Open mandates</dt>
              <dd className="font-numeric heading-6">{home?.header.openMandatesCount ?? 0}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="title-4">Profile</span>
              <span className="font-numeric text-sm font-semibold text-text-primary">{profileCompletion}%</span>
            </div>
            <ProgressBar value={profileCompletion} />
            <p className="caption-5">Founders read your thesis and ticket size before they send a request.</p>
            <PanelLink href="/investor/profile">Complete your profile</PanelLink>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="signals-heading">
        <SectionHeader id="signals-heading" title="Market signals" description="What is moving on VittamHub this week." />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card className="flex flex-col gap-4">
            <PanelTitle icon={TrendingUp} title="Trending industries" />
            {recommendations && recommendations.trendingIndustries.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {recommendations.trendingIndustries.slice(0, 6).map((entry) => (
                  <li key={entry.industry} className="flex items-center justify-between gap-3">
                    <span className="body-6 text-text-primary">{labelFor(INDUSTRY_LABEL, entry.industry)}</span>
                    <span className="font-numeric caption-5">{entry.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caption-5">Not enough activity yet to spot a trend.</p>
            )}
          </Card>
          <StartupList
            icon={ShieldCheck}
            title="Recently verified"
            empty="No newly verified startups yet."
            startups={recommendations?.recentlyVerifiedStartups}
          />
          <StartupList
            icon={UserCheck}
            title="Recently active founders"
            empty="No recent founder activity yet."
            startups={recommendations?.recentlyActiveFounders}
          />
        </div>
      </section>
    </div>
  );
}

function StartupList({
  icon,
  title,
  empty,
  startups,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
  empty: string;
  startups: { id: string; slug: string; name: string; industry: string }[] | undefined;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={icon} title={title} />
      {startups && startups.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {startups.slice(0, 5).map((startup) => (
            <li key={startup.id} className="flex flex-col gap-0.5">
              <Link href={`/startups/${startup.slug}`} className="body-6 font-semibold text-text-primary hover:text-brand-700 hover:underline">
                {startup.name}
              </Link>
              <span className="caption-5">{labelFor(INDUSTRY_LABEL, startup.industry)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="caption-5">{empty}</p>
      )}
    </Card>
  );
}
