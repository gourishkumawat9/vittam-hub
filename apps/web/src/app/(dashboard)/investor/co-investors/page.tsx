"use client";

import { useMyCoInvestorGraph } from "@vittamhub/api-client";
import { Avatar, Badge, Card, CardHeader, CardTitle, EmptyState, ErrorState } from "@vittamhub/ui";
import { Network, Users } from "lucide-react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { StatTilesSkeleton } from "@/components/dashboard/StatTilesSkeleton";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CoInvestorGraphPage() {
  const { data, isLoading, isError } = useMyCoInvestorGraph();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Co-investor graph</h1>
        </div>
        <StatTilesSkeleton count={2} />
        <ListRowsSkeleton />
      </div>
    );
  }
  if (isError) return <ErrorState />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Co-investor graph</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real shared investments and confirmed relationships. No AI, no inferred connections.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs text-text-secondary">Co-investors</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data?.coInvestors.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Mutual confirmations</p>
          <p className="font-numeric text-2xl font-bold text-text-primary">{data?.mutualConfirmations ?? 0}</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <Network className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-base">Most frequent co-investors</CardTitle>
        </CardHeader>
        {data && data.coInvestors.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {data.coInvestors.map((co) => (
              <div key={co.investorId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={co.avatarUrl} name={co.fullName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{co.fullName}</p>
                    <p className="text-xs text-text-secondary">{co.sharedStartups.map((s) => s.name).join(", ")}</p>
                  </div>
                </div>
                <Badge variant="brand">
                  {co.sharedStartups.length} shared investment{co.sharedStartups.length === 1 ? "" : "s"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Network} title="No co-investors yet" description="Once you share a portfolio company with another investor, they'll show up here." className="py-6" />
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <Users className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-base">Potential syndicate partners</CardTitle>
        </CardHeader>
        <p className="text-xs text-text-secondary">Investors whose declared thesis overlaps with yours, that you haven&apos;t co-invested with yet.</p>
        {data && data.syndicatePartners.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.syndicatePartners.map((partner) => (
              <div key={partner.ownerId} className="flex items-center justify-between rounded-card border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{partner.owner.fullName}</p>
                  <p className="text-xs text-text-secondary">{partner.firmName ?? titleCase(partner.investorType)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary">No overlapping-thesis investors found yet.</p>
        )}
      </Card>
    </div>
  );
}
