"use client";

import { useFounderRecommendations, useInvestors, useMyStartup, type InvestorWithOwner } from "@vittamhub/api-client";
import type { InvestorSearchFilters } from "@vittamhub/types";
import { Button, Dialog, EmptyState } from "@vittamhub/ui";
import { Handshake } from "@vittamhub/ui/icons";
import Link from "next/link";
import { useState } from "react";

import { SendConnectRequestDialog } from "@/components/connections/SendConnectRequestDialog";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { ConnectRequestsList } from "@/components/dashboard/founder/ConnectRequestsList";
import { InvestorCard } from "@/components/dashboard/founder/InvestorCard";
import { InvestorFiltersBar } from "@/components/dashboard/founder/InvestorFiltersBar";
import { isNotFoundError } from "@/lib/utils";

/**
 * Finding investors, moved off the founder home so that page can stay a
 * summary. Founders never message an investor directly: every card's button
 * opens a connect request (CLAUDE.md §4).
 */
export default function FounderInvestorsPage() {
  const [filters, setFilters] = useState<InvestorSearchFilters>({ matchMyStartup: true, page: 1, pageSize: 20 });
  const { data: results, isLoading } = useInvestors(filters);
  const { data: recommendations } = useFounderRecommendations();
  const [connectingTo, setConnectingTo] = useState<InvestorWithOwner | null>(null);
  // A founder can browse straight after signing up, but a connect request
  // carries the startup's name, stage and industry, so it needs a published
  // profile (the API refuses one without it too).
  const { isError: startupFailed, error: startupError } = useMyStartup();
  const noStartupYet = startupFailed && isNotFoundError(startupError);
  const [profileNeededOpen, setProfileNeededOpen] = useState(false);
  const connect = (investor: InvestorWithOwner) => (noStartupYet ? setProfileNeededOpen(true) : setConnectingTo(investor));
  const investors = results?.items ?? [];
  const recommended = recommendations?.recommendedInvestors ?? [];
  const recommendedIds = new Set(recommended.map((match) => match.investorId));
  // An investor already shown as a recommendation isn't repeated in the search results below it.
  const others = investors.filter((investor) => !recommendedIds.has(investor.id));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Investors"
        description={
          noStartupYet
            ? "Browse freely. Publish your startup profile to send a connect request."
            : "Send a connect request with your summary and deck. Chat, documents and meetings open once an investor accepts."
        }
      />

      {recommended.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="recommended-heading">
          <SectionHeader
            id="recommended-heading"
            title="Recommended for you"
            description="Ranked by industry, stage, ticket size, location and whether they are open for pitches. Rules, not machine learning."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((match) => (
              <InvestorCard key={match.investorId} investor={match.investor} onConnect={connect} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="discover-heading">
        <SectionHeader id="discover-heading" title="All investors" description="Filter by what they back. Verified profiles come first." />
        <InvestorFiltersBar filters={filters} onChange={setFilters} />
        {isLoading ? (
          <CardGridSkeleton />
        ) : others.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((investor) => (
              <InvestorCard key={investor.id} investor={investor} onConnect={connect} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Handshake}
            title={investors.length > 0 ? "No other investors match these filters" : "No investors match these filters"}
            description="Try clearing a filter, or turn off matching to your startup's industry and stage."
          />
        )}
      </section>

      <section id="requests" className="flex scroll-mt-24 flex-col gap-4" aria-labelledby="requests-heading">
        <SectionHeader id="requests-heading" title="Your connect requests" />
        <ConnectRequestsList emptyHint="Requests you send show up here with their status." />
      </section>

      <Dialog
        open={profileNeededOpen}
        onOpenChange={setProfileNeededOpen}
        title="Publish your startup profile first"
        description="An investor sees your startup's name, stage and industry with every connect request, so there has to be a profile for them to look at."
        footer={
          <>
            <Button variant="secondary" onClick={() => setProfileNeededOpen(false)}>
              Not now
            </Button>
            <Button asChild>
              <Link href="/onboarding/founder">Set up my profile</Link>
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Only &quot;About you&quot; and &quot;Your startup&quot; are needed to publish. Everything you have already entered is saved.
        </p>
      </Dialog>

      {connectingTo && (
        <SendConnectRequestDialog investor={connectingTo} open={!!connectingTo} onOpenChange={(open) => !open && setConnectingTo(null)} />
      )}
    </div>
  );
}
