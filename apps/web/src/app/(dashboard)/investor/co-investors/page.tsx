"use client";

import { useMyCoInvestorGraph, useMyInvestorProfile } from "@vittamhub/api-client";
import { Avatar, Badge, Card, EmptyState, ErrorState } from "@vittamhub/ui";
import { Briefcase, Network, Users } from "lucide-react";
import Link from "next/link";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { INVESTOR_TYPE_LABEL } from "@/lib/signup-options";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";

export default function CoInvestorGraphPage() {
  const { data, isLoading, isError } = useMyCoInvestorGraph();
  const { data: me } = useMyInvestorProfile();

  const header = (
    <PageHeader
      title="Co-investors"
      description="Investors who backed the same startups as you, taken from recorded investments, and investors whose thesis overlaps with yours. Nothing here is guessed."
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ListRowsSkeleton />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState />
      </div>
    );
  }

  const sharedStartups = new Set(data.coInvestors.flatMap((co) => co.sharedStartups.map((s) => s.id)));
  const mySectors = new Set(me?.preferredIndustries ?? []);
  const myStages = new Set<string>(me?.preferredStages ?? []);

  return (
    <div className="flex flex-col gap-6">
      {header}

      <StatStrip
        stats={[
          { label: "Co-investors", value: data.coInvestors.length, hint: "Backed a startup you backed" },
          { label: "Startups in common", value: sharedStartups.size, hint: "Across all of them" },
          { label: "Confirmed by the startup", value: data.mutualConfirmations, hint: "Of your recorded investments", href: "/investor/portfolio" },
        ]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="flex flex-col gap-4 lg:col-span-3">
          <PanelTitle icon={Network} title="Who you invest alongside" />
          {data.coInvestors.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {data.coInvestors.map((co) => (
                <li key={co.investorId} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={co.avatarUrl} name={co.fullName} size="md" />
                    <div className="min-w-0">
                      <p className="body-5 truncate text-text-primary">{co.fullName}</p>
                      <p className="caption-5 truncate">{co.sharedStartups.map((s) => s.name).join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex -space-x-2" aria-hidden="true">
                      {co.sharedStartups.slice(0, 4).map((startup) => (
                        <Avatar key={startup.id} src={startup.logoUrl} name={startup.name} size="sm" className="rounded-button ring-2 ring-surface" />
                      ))}
                    </div>
                    <Badge variant="brand">
                      {co.sharedStartups.length} in common
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No co-investors yet"
              description="When another investor records an investment in a startup you've recorded in Portfolio, they show up here."
              action={
                <Link href="/investor/portfolio" className="text-sm font-medium text-brand-primary hover:underline">
                  Open portfolio
                </Link>
              }
              className="py-8"
            />
          )}
        </Card>

        <Card className="flex flex-col gap-4 lg:col-span-2">
          <PanelTitle icon={Users} title="Thesis like yours" />
          <p className="caption-5">Investors who back the same sectors or stages and haven&apos;t invested alongside you yet. People to talk to about a round.</p>
          {data.syndicatePartners.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {data.syndicatePartners.map((partner) => {
                const sectors = partner.preferredIndustries.filter((s) => mySectors.has(s));
                const stages = partner.preferredStages.filter((s) => myStages.has(s));
                return (
                  <li key={partner.ownerId} className="flex flex-col gap-2 rounded-button border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={partner.owner.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="body-5 truncate text-text-primary">{partner.owner.fullName}</p>
                        <p className="caption-5 truncate">{partner.firmName ?? INVESTOR_TYPE_LABEL[partner.investorType] ?? partner.investorType}</p>
                      </div>
                    </div>
                    {sectors.length + stages.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sectors.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                            {INDUSTRY_LABEL[s] ?? s}
                          </span>
                        ))}
                        {stages.slice(0, 2).map((s) => (
                          <span key={s} className="rounded-full bg-background-secondary px-2 py-0.5 text-[11px] text-text-secondary">
                            {STAGE_LABEL[s] ?? s}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="caption-5 rounded-button bg-background-secondary px-3 py-3">
              No other investor shares your sectors or stages yet. Set them on your{" "}
              <Link href="/investor/profile" className="font-medium text-brand-primary hover:underline">
                profile
              </Link>{" "}
              if you haven&apos;t.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
