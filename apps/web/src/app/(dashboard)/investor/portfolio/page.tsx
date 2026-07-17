"use client";

import { usePortfolio } from "@vittamhub/api-client";
import { Badge, Card, EmptyState } from "@vittamhub/ui";
import { formatCompactUsd } from "@vittamhub/utils";
import { Briefcase } from "lucide-react";
import Link from "next/link";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

export default function PortfolioPage() {
  const { data: investments, isLoading } = usePortfolio();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">My Portfolio</h1>

      {isLoading ? (
        <CardGridSkeleton />
      ) : investments && investments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => (
            <Card key={investment.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{investment.startup.name}</h3>
                  <p className="text-xs text-text-secondary">Invested {new Date(investment.investedAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="brand">{investment.startup.stage}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-card bg-background-secondary p-3 text-xs">
                <span className="text-text-secondary">Team size</span>
                <span className="text-right font-medium text-text-primary">{investment.startup.teamSize}</span>
                <span className="text-text-secondary">Monthly revenue</span>
                <span className="text-right font-medium text-text-primary">
                  {investment.startup.traction?.monthlyRevenueUsd ? formatCompactUsd(investment.startup.traction.monthlyRevenueUsd) : "—"}
                </span>
                <span className="text-text-secondary">Growth rate</span>
                <span className="text-right font-medium text-text-primary">
                  {investment.startup.traction?.growthRatePercent != null ? `${investment.startup.traction.growthRatePercent}%` : "—"}
                </span>
                {investment.amountUsd != null && (
                  <>
                    <span className="text-text-secondary">Invested amount</span>
                    <span className="text-right font-medium text-text-primary">{formatCompactUsd(investment.amountUsd)}</span>
                  </>
                )}
              </div>

              <Link href={`/startups/${investment.startup.slug}`} className="text-xs font-medium text-brand-primary hover:underline">
                View latest updates →
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No portfolio companies yet"
          description="Move a pipeline entry to Invested to see it here."
        />
      )}
    </div>
  );
}
