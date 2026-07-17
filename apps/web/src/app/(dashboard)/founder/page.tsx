"use client";

import {
  useConnectionQuota,
  useConnections,
  useFounderRecommendations,
  useInvestors,
  useMyStartup,
  useMyStartupHealth,
  type InvestorWithOwner,
} from "@vittamhub/api-client";
import type { InvestorSearchFilters } from "@vittamhub/types";
import { Badge, Button, Card, EmptyState } from "@vittamhub/ui";
import { formatCompactUsd, formatRelativeTime } from "@vittamhub/utils";
import { Handshake, Inbox, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { SendConnectRequestDialog } from "@/components/connections/SendConnectRequestDialog";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { FounderActivityCard } from "@/components/dashboard/founder/FounderActivityCard";
import { FounderReputationCard } from "@/components/dashboard/founder/FounderReputationCard";
import { InvestorFiltersBar } from "@/components/dashboard/founder/InvestorFiltersBar";
import { ProfileCompletionCard } from "@/components/dashboard/founder/ProfileCompletionCard";
import { QuickActionsCard } from "@/components/dashboard/founder/QuickActionsCard";
import { RecentProfileViewsCard } from "@/components/dashboard/founder/RecentProfileViewsCard";
import { RecentUpdatesCard } from "@/components/dashboard/founder/RecentUpdatesCard";
import { StartupHealthCard } from "@/components/dashboard/founder/StartupHealthCard";
import { TrustScoreCard } from "@/components/dashboard/founder/TrustScoreCard";

function InvestorCard({ investor, onConnect }: { investor: InvestorWithOwner; onConnect: (investor: InvestorWithOwner) => void }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{investor.owner.fullName}</h3>
          <p className="text-xs text-text-secondary">{investor.firmName ?? "Independent investor"}</p>
        </div>
        <Badge variant={investor.openForPitches ? "success" : "neutral"}>
          {investor.openForPitches ? "Open for pitches" : "Not reviewing"}
        </Badge>
      </div>

      <p className="text-sm text-text-secondary">{investor.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {investor.preferredIndustries.slice(0, 4).map((industry) => (
          <Badge key={industry} variant="brand">
            {industry}
          </Badge>
        ))}
      </div>

      {investor.metrics && (investor.metrics.responseRate != null || investor.metrics.isActive) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          {investor.metrics.responseRate != null && <span>Responds to {Math.round(investor.metrics.responseRate * 100)}% of requests</span>}
          {investor.metrics.avgResponseTimeHours != null && (
            <span>~{Math.round(investor.metrics.avgResponseTimeHours)}h avg response</span>
          )}
          {investor.metrics.isActive && <Badge variant="success">Recently active</Badge>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-text-secondary">
        <span>
          {formatCompactUsd(Number(investor.checkSizeMinUsd))} – {formatCompactUsd(Number(investor.checkSizeMaxUsd))}
        </span>
        <Button size="sm" onClick={() => onConnect(investor)} disabled={!investor.openForPitches}>
          Connect
        </Button>
      </div>
    </Card>
  );
}

export default function FounderDashboardPage() {
  const { data: startup, isLoading: startupLoading, isError: startupError } = useMyStartup();
  const { data: health } = useMyStartupHealth();
  const [investorFilters, setInvestorFilters] = useState<InvestorSearchFilters>({ matchMyStartup: true, page: 1, pageSize: 20 });
  const { data: investorResults, isLoading: investorsLoading } = useInvestors(investorFilters);
  const investors = investorResults?.items ?? [];
  const { data: connectionsResult, isLoading: connectionsLoading } = useConnections();
  const connections = connectionsResult?.items;
  const { data: quota } = useConnectionQuota();
  const { data: recommendations, isLoading: recommendationsLoading } = useFounderRecommendations();
  const [connectingTo, setConnectingTo] = useState<InvestorWithOwner | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Founder dashboard</h1>
        {quota && (
          <Badge variant={quota.remaining === 0 ? "danger" : "neutral"}>
            {quota.limit === null
              ? "Unlimited connect requests"
              : `${quota.remaining} of ${quota.limit} connect requests left this month`}
          </Badge>
        )}
      </div>

      {startupError && !startupLoading && (
        <Card className="flex items-center justify-between gap-4 border-warning-200 bg-warning-50">
          <p className="text-sm text-text-primary">Finish publishing your startup profile to unlock your dashboard.</p>
          <Button size="sm" asChild>
            <Link href="/onboarding/founder">Continue onboarding</Link>
          </Button>
        </Card>
      )}

      {quota?.remaining === 0 && (
        <Card className="flex items-center justify-between gap-4 border-warning-200 bg-warning-50">
          <p className="text-sm text-text-primary">
            You&apos;ve used all your connect requests for this month on the {quota.plan} plan.
          </p>
          <Button size="sm" variant="secondary" disabled>
            Upgrade (coming soon)
          </Button>
        </Card>
      )}

      {startup && (
        <div className="grid gap-4 lg:grid-cols-3">
          <StartupHealthCard startup={startup} />
          {health && <TrustScoreCard trustScore={health.trustScore} />}
          {health && <ProfileCompletionCard completion={health.profileCompletion} />}
        </div>
      )}

      {startup && health && (
        <div className="grid gap-4 lg:grid-cols-3">
          <FounderReputationCard founderReputation={health.founderReputation} />
        </div>
      )}

      {startup && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentUpdatesCard milestones={startup.milestones} />
          </div>
          <QuickActionsCard startupSlug={startup.slug} />
        </div>
      )}

      {startup && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FounderActivityCard />
          </div>
          <RecentProfileViewsCard />
        </div>
      )}

      {startup && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-primary">Recommended investors</h2>
            <p className="text-sm text-text-secondary">
              Ranked by industry, stage, funding fit, geography, and pitch availability — not machine-learned.
            </p>
          </div>
          {recommendationsLoading ? (
            <CardGridSkeleton count={3} />
          ) : recommendations && recommendations.recommendedInvestors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.recommendedInvestors.map((match) => (
                <InvestorCard key={match.investorId} investor={match.investor} onConnect={setConnectingTo} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No recommendations yet"
              description="Complete your startup profile to get matched with investors."
            />
          )}
        </section>
      )}

      <section id="discover-investors" className="flex flex-col gap-4 scroll-mt-20">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Discover investors</h2>
        <InvestorFiltersBar filters={investorFilters} onChange={setInvestorFilters} />
        {investorsLoading ? (
          <CardGridSkeleton />
        ) : investors && investors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investors.map((investor) => (
              <InvestorCard key={investor.id} investor={investor} onConnect={setConnectingTo} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Handshake} title="No investors listed yet" description="Check back soon as investors join VittamHub." />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Your connect requests</h2>
        {connectionsLoading ? (
          <ListRowsSkeleton />
        ) : connections && connections.length > 0 ? (
          <div className="flex flex-col divide-y divide-border rounded-card border border-border">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{connection.recipient.fullName}</p>
                  <p className="text-xs text-text-secondary">Sent {formatRelativeTime(connection.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ConnectionStatusBadge status={connection.status} />
                  {connection.status === "ACCEPTED" && (
                    <Link
                      href={`/connections/${connection.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No connect requests yet" description="Send your first request to an investor above." />
        )}
      </section>

      {connectingTo && (
        <SendConnectRequestDialog investor={connectingTo} open={!!connectingTo} onOpenChange={(open) => !open && setConnectingTo(null)} />
      )}
    </div>
  );
}
