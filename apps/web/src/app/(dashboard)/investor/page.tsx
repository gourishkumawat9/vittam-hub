"use client";

import {
  useConnections,
  useInvestorRecommendations,
  useMyInvestorProfile,
  useMyMeetings,
  usePortfolio,
  useUnreadNotificationCount,
  useWatchlist,
} from "@vittamhub/api-client";
import { Badge, Card, CardHeader, CardTitle, EmptyState, Input, ProgressBar } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import {
  BarChart3,
  Bookmark,
  Briefcase,
  Calendar,
  CalendarClock,
  Compass,
  Handshake,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

function computeProfileCompletion(investor: ReturnType<typeof useMyInvestorProfile>["data"]) {
  if (!investor) return 0;
  const checks = [
    !!investor.bio,
    !!investor.investmentThesis,
    investor.preferredIndustries.length > 0,
    investor.preferredStages.length > 0,
    Number(investor.checkSizeMaxUsd) > 0,
    investor.portfolioCompanies.length > 0,
    !!investor.website,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function DashboardCard({
  icon: Icon,
  title,
  value,
  href,
  description,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  href: string;
  description?: string;
}) {
  return (
    <Link href={href}>
      <Card interactive className="flex flex-col gap-2">
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <Icon className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-xs font-medium text-text-secondary">{title}</CardTitle>
        </CardHeader>
        <span className="font-numeric text-2xl font-bold text-text-primary">{value}</span>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </Card>
    </Link>
  );
}

export default function InvestorDashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: pendingConnectionsResult } = useConnections({ status: ["PENDING"], page: 1, pageSize: 20 });
  const { data: watchlist } = useWatchlist();
  const { data: portfolio } = usePortfolio();
  const { data: meetings } = useMyMeetings();
  const { data: unread } = useUnreadNotificationCount();
  const { data: recommendations } = useInvestorRecommendations();
  const { data: investorProfile } = useMyInvestorProfile();

  const pendingRequests = pendingConnectionsResult?.items ?? [];
  const savedCount = (watchlist ?? []).filter((f) => !f.notifyOnUpdate).length;
  const upcomingMeetings = (meetings ?? []).filter((m) => new Date(m.scheduledAt) > new Date());
  const profileCompletion = computeProfileCompletion(investorProfile);

  const meetingsThisWeek = upcomingMeetings.filter((m) => {
    const days = (new Date(m.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  });
  const meetingsByDay = new Map<string, typeof meetingsThisWeek>();
  for (const meeting of meetingsThisWeek) {
    const key = WEEKDAY_FORMATTER.format(new Date(meeting.scheduledAt));
    meetingsByDay.set(key, [...(meetingsByDay.get(key) ?? []), meeting]);
  }

  const submitSearch = () => {
    router.push(query.trim() ? `/investor/discover?query=${encodeURIComponent(query.trim())}` : "/investor/discover");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Investor dashboard</h1>
        <div className="flex w-full max-w-xs gap-2 sm:w-auto">
          <Input
            placeholder="Search startups…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          />
          <button
            type="button"
            onClick={submitSearch}
            aria-label="Search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button border border-border text-text-secondary hover:bg-background-secondary hover:text-text-primary"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard icon={Handshake} title="New connection requests" value={pendingConnectionsResult?.totalItems ?? 0} href="/investor/requests" />
        <DashboardCard icon={Bookmark} title="Saved startups" value={savedCount} href="/investor/watchlist?tab=saved" />
        <DashboardCard icon={Briefcase} title="Portfolio companies" value={(portfolio ?? []).length} href="/investor/portfolio" />
        <DashboardCard icon={Calendar} title="Upcoming meetings" value={upcomingMeetings.length} href="/investor/meetings" />
        <DashboardCard icon={MessageCircle} title="Unread notifications" value={unread?.count ?? 0} href="/investor/messages" />
        <DashboardCard
          icon={Sparkles}
          title="Recommended today"
          value={recommendations?.highPotentialStartups.length ?? 0}
          href="/investor/recommendations"
        />
        <DashboardCard icon={Compass} title="Investment opportunities" value={recommendations?.fastestGrowingCompanies.length ?? 0} href="/investor/discover" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Recent updates</CardTitle>
          </CardHeader>
          {pendingRequests.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pendingRequests.slice(0, 5).map((connection) => (
                <div key={connection.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{connection.startup?.name ?? connection.requester.fullName} sent a connect request</span>
                  <span className="text-xs text-text-secondary">{formatRelativeTime(connection.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No recent activity yet.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Profile completion</CardTitle>
          </CardHeader>
          <ProgressBar value={profileCompletion} />
          <Link href="/investor/profile" className="text-xs font-medium text-brand-primary hover:underline">
            Complete your profile →
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Trending industries</CardTitle>
          </CardHeader>
          {recommendations && recommendations.trendingIndustries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {recommendations.trendingIndustries.slice(0, 8).map((entry) => (
                <Badge key={entry.industry} variant="brand">
                  {entry.industry} · {entry.count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Not enough activity yet to spot a trend.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <ShieldCheck className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Recently verified</CardTitle>
          </CardHeader>
          {recommendations && recommendations.recentlyVerifiedStartups.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recommendations.recentlyVerifiedStartups.slice(0, 5).map((startup) => (
                <li key={startup.id}>
                  <Link href={`/startups/${startup.slug}`} className="text-sm font-medium text-text-primary hover:text-brand-primary hover:underline">
                    {startup.name}
                  </Link>
                  <p className="text-xs text-text-secondary">{startup.industry}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No newly verified startups yet.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <UserCheck className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-base">Recently active founders</CardTitle>
          </CardHeader>
          {recommendations && recommendations.recentlyActiveFounders.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recommendations.recentlyActiveFounders.slice(0, 5).map((startup) => (
                <li key={startup.id}>
                  <Link href={`/startups/${startup.slug}`} className="text-sm font-medium text-text-primary hover:text-brand-primary hover:underline">
                    {startup.name}
                  </Link>
                  <p className="text-xs text-text-secondary">{startup.industry}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No recent founder activity yet.</p>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <CalendarClock className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-base">Upcoming meetings this week</CardTitle>
        </CardHeader>
        {meetingsByDay.size > 0 ? (
          <div className="flex flex-col gap-3">
            {Array.from(meetingsByDay.entries()).map(([day, dayMeetings]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{day}</p>
                <div className="mt-1 flex flex-col gap-1">
                  {dayMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">
                        {meeting.connection.startup?.name ?? meeting.connection.requester.fullName}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(meeting.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarClock} title="No meetings this week" description="Proposed meeting times will show up here." className="py-6" />
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link href="/investor/discover" className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary hover:bg-background-secondary">
            <Compass className="h-4 w-4 text-brand-primary" /> Discover
          </Link>
          <Link href="/investor/pipeline" className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary hover:bg-background-secondary">
            <Plus className="h-4 w-4 text-brand-primary" /> Pipeline
          </Link>
          <Link href="/investor/requests" className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary hover:bg-background-secondary">
            <Handshake className="h-4 w-4 text-brand-primary" /> Requests
          </Link>
          <Link href="/investor/analytics" className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary hover:bg-background-secondary">
            <BarChart3 className="h-4 w-4 text-brand-primary" /> Analytics
          </Link>
        </div>
      </Card>
    </div>
  );
}
