"use client";

import {
  useConnectionQuota,
  useFounderRecommendations,
  useMyGrowthBenchmark,
  useMyStartup,
  useMyStartupAnalytics,
  useMyStartupHealth,
  type InvestorWithOwner,
} from "@vittamhub/api-client";
import { Badge, Button, Card, ErrorState, Skeleton } from "@vittamhub/ui";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { SendConnectRequestDialog } from "@/components/connections/SendConnectRequestDialog";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { ProfileStrengthCard } from "@/components/dashboard/ProfileStrengthCard";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { StatTilesSkeleton } from "@/components/dashboard/StatTilesSkeleton";
import { AddMilestoneDialog } from "@/components/dashboard/founder/AddMilestoneDialog";
import { ConnectRequestsList } from "@/components/dashboard/founder/ConnectRequestsList";
import { FounderActivityCard } from "@/components/dashboard/founder/FounderActivityCard";
import { GrowthBenchmarkCard } from "@/components/dashboard/founder/GrowthBenchmarkCard";
import { InvestorCard } from "@/components/dashboard/founder/InvestorCard";
import { NextActionsCard } from "@/components/dashboard/founder/NextActionsCard";
import { RecentProfileViewsCard } from "@/components/dashboard/founder/RecentProfileViewsCard";
import { RecentUpdatesCard } from "@/components/dashboard/founder/RecentUpdatesCard";
import { SetUpProfileCard } from "@/components/dashboard/founder/SetUpProfileCard";
import { StandingPanel } from "@/components/dashboard/founder/StandingPanel";
import { VisibilitySettingsCard } from "@/components/dashboard/founder/VisibilitySettingsCard";
import { STAGE_LABEL, VERIFICATION_VARIANT } from "@/components/dashboard/founder/startup-labels";
import { isNotFoundError } from "@/lib/utils";

/**
 * The founder's home. Reads top to bottom as: what to do next and where you
 * stand, then the investor side (requests, who looked, who fits), then your
 * own record (milestones, activity) and settings. Finding investors has its
 * own page (/founder/investors) so this one stays a summary.
 */
export default function FounderDashboardPage() {
  const { data: startup, isLoading: startupLoading, isError: startupFailed, error: startupError, refetch: refetchStartup } = useMyStartup();
  const { data: health } = useMyStartupHealth();
  const { data: benchmark } = useMyGrowthBenchmark();
  const { data: quota } = useConnectionQuota();
  const { data: analytics } = useMyStartupAnalytics();
  const { data: recommendations, isLoading: recommendationsLoading } = useFounderRecommendations();
  const [connectingTo, setConnectingTo] = useState<InvestorWithOwner | null>(null);
  // One "Add milestone" dialog, opened from Next actions, Profile completion and the header.
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const openMilestone = () => setMilestoneOpen(true);

  if (startupLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-16 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full lg:col-span-2" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  // A real failure loading the profile is not the same as having none yet.
  if (startupFailed && !isNotFoundError(startupError)) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Founder home" />
        <ErrorState
          title="Your startup profile didn't load"
          description="Check your connection and try again."
          onRetry={() => void refetchStartup()}
          className="py-10"
        />
      </div>
    );
  }

  // A founder lands here straight after signing up, before any startup
  // profile exists: the API answers 404 until it is published.
  if (!startup) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Founder home"
          description="Your account is ready. Set up your startup profile whenever you like."
          actions={
            <Button variant="secondary" size="sm" asChild>
              <Link href="/founder/investors">Browse investors</Link>
            </Button>
          }
        />
        <SetUpProfileCard />
      </div>
    );
  }

  const quotaHint = quota && (quota.limit === null ? "Unlimited this month" : `${quota.remaining} of ${quota.limit} left this month`);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={startup.name}
        description={startup.tagline}
        meta={
          <>
            <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
            {startup.verificationStatus === "VERIFIED" ? (
              <VerifiedBadge status={startup.verificationStatus} />
            ) : (
              <Badge variant={VERIFICATION_VARIANT[startup.verificationStatus] ?? "neutral"}>Not verified yet</Badge>
            )}
            {startup.isFundraising && <Badge variant="success">Fundraising</Badge>}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/startups/${startup.slug}`}>
                <Eye className="h-4 w-4" aria-hidden="true" /> View public page
              </Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={openMilestone}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add milestone
            </Button>
            <Button size="sm" asChild>
              <Link href="/founder/investors">Find investors</Link>
            </Button>
          </>
        }
      />

      {quota?.remaining === 0 && (
        <Card className="border-warning-100 bg-warning-50 dark:border-warning-600/40 dark:bg-warning-500/10">
          {/* A disabled "Upgrade (coming soon)" button stood here: there is nothing to buy yet (CLAUDE.md §5). */}
          <p className="body-6 text-text-primary">
            You have used this month&apos;s connect requests. New ones become available on the 1st of next month.
          </p>
        </Card>
      )}

      {/* The numbers a founder checks first, each a way into its page. */}
      {analytics ? (
        <StatStrip
          stats={[
            {
              label: "Investor views",
              value: analytics.totalInvestorViews,
              hint: analytics.totalInvestorViews === 0 ? "Shown when an investor opens your profile" : "Since your profile went live",
              href: "/founder/analytics",
            },
            {
              label: "Connect requests sent",
              value: analytics.connectionRequestsReceived,
              hint: quotaHint ?? undefined,
              href: "/founder/investors",
            },
            { label: "Followers", value: analytics.followerCount, hint: "People following your updates" },
            {
              label: "Profile complete",
              value: `${analytics.profileCompletionPercent}%`,
              hint: analytics.profileCompletionPercent < 100 ? "More detail, more investor interest" : "Everything investors look for",
              href: "/onboarding/founder",
            },
          ]}
        />
      ) : (
        <StatTilesSkeleton />
      )}

      {/* 1. What moves the startup forward, beside where it stands today. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {health ? <NextActionsCard trustScore={health.trustScore} onAddMilestone={openMilestone} /> : <Skeleton className="h-full min-h-64 w-full" />}
        </div>
        {health ? <StandingPanel health={health} /> : <Skeleton className="h-full min-h-64 w-full" />}
      </div>

      {/* 2. The investor side: requests sent, who looked, who fits. */}
      <section className="flex flex-col gap-4" aria-labelledby="investors-heading">
        <SectionHeader
          id="investors-heading"
          title="Investors"
          description="Requests you have sent and the investors who match your stage and industry."
          href="/founder/investors"
          linkLabel="Find investors"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-col gap-3">
              <h3 className="title-4">Your connect requests</h3>
              <ConnectRequestsList limit={5} emptyHint="Send your first request from the investors page. Each one carries your summary and deck." />
            </div>
            {recommendationsLoading ? (
              <CardGridSkeleton count={2} />
            ) : recommendations && recommendations.recommendedInvestors.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="title-4">Investors who fit your startup</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  {recommendations.recommendedInvestors.slice(0, 2).map((match) => (
                    <InvestorCard key={match.investorId} investor={match.investor} onConnect={setConnectingTo} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="lg:self-start">
            <RecentProfileViewsCard />
          </div>
        </div>
      </section>

      {/* 3. The startup's own record, then the profile and its settings. */}
      <section className="flex flex-col gap-4" aria-labelledby="record-heading">
        <SectionHeader id="record-heading" title="Your record" description="Milestones you have added and what has happened on your profile." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentUpdatesCard milestones={startup.milestones} />
          </div>
          <FounderActivityCard />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="profile-heading">
        <SectionHeader id="profile-heading" title="Profile" description="What is still missing, and who can see what." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProfileStrengthCard />
          <VisibilitySettingsCard startup={startup} />
          {benchmark && <GrowthBenchmarkCard benchmark={benchmark} />}
        </div>
      </section>

      <AddMilestoneDialog open={milestoneOpen} onOpenChange={setMilestoneOpen} />

      {connectingTo && (
        <SendConnectRequestDialog investor={connectingTo} open={!!connectingTo} onOpenChange={(open) => !open && setConnectingTo(null)} />
      )}
    </div>
  );
}
