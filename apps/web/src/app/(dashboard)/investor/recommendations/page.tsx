"use client";

import { useInvestorRecommendations } from "@vittamhub/api-client";
import type { Startup } from "@vittamhub/types";
import { Badge, Card, EmptyState } from "@vittamhub/ui";
import { Sparkles } from "lucide-react";
import Link from "next/link";

function StartupRow({ startup }: { startup: Startup }) {
  return (
    <Link
      href={`/startups/${startup.slug}`}
      className="flex items-center justify-between gap-3 rounded-card border border-border px-4 py-3 transition-colors hover:bg-background-secondary"
    >
      <div>
        <p className="text-sm font-medium text-text-primary">{startup.name}</p>
        <p className="text-xs text-text-secondary">{startup.tagline}</p>
      </div>
      <Badge variant="brand">{startup.industry}</Badge>
    </Link>
  );
}

export default function RecommendationsPage() {
  const { data, isLoading } = useInvestorRecommendations();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!data) return <EmptyState icon={Sparkles} title="No recommendations yet" description="Check back once more startups have joined." />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">AI Recommendations</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Rule-based suggestions from real platform activity — not a machine-learning model yet.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-text-primary">High potential startups</h2>
        {data.highPotentialStartups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.highPotentialStartups.map((s) => (
              <StartupRow key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Nothing to show yet.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Fastest growing companies</h2>
        {data.fastestGrowingCompanies.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.fastestGrowingCompanies.map((s) => (
              <StartupRow key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Nothing to show yet.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Similar to your previous investments</h2>
        {data.similarToPreviousInvestments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.similarToPreviousInvestments.map((s) => (
              <StartupRow key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Invest in a startup to see similar recommendations.</p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-heading text-sm font-semibold text-text-primary">Trending industries</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.trendingIndustries.length > 0 ? (
              data.trendingIndustries.map((t) => (
                <Badge key={t.industry} variant="neutral">
                  {t.industry} ({t.count})
                </Badge>
              ))
            ) : (
              <p className="text-xs text-text-secondary">No fundraising activity yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-heading text-sm font-semibold text-text-primary">Emerging markets</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.emergingMarkets.length > 0 ? (
              data.emergingMarkets.map((m) => (
                <Badge key={m.location} variant="neutral">
                  {m.location} ({m.count})
                </Badge>
              ))
            ) : (
              <p className="text-xs text-text-secondary">No data yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
