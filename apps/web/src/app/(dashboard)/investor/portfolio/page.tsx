"use client";

import { usePortfolio, usePortfolioDashboard, useRecordExit, useSetFollowUp, type InvestmentWithStartup } from "@vittamhub/api-client";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState, Input } from "@vittamhub/ui";
import { formatCompactMoney, formatRelativeTime } from "@vittamhub/utils";
import { Briefcase, CalendarClock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

function PortfolioCard({ investment }: { investment: InvestmentWithStartup }) {
  const recordExit = useRecordExit();
  const setFollowUp = useSetFollowUp();
  const [exitValue, setExitValue] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const isExited = !!investment.exitedAt;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{investment.startup.name}</h3>
          <p className="text-xs text-text-secondary">Invested {new Date(investment.investedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="brand">{investment.startup.stage}</Badge>
          <Badge variant={isExited ? "neutral" : "success"}>{isExited ? "Exited" : "Active"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-card bg-background-secondary p-3 text-xs">
        <span className="text-text-secondary">Team size</span>
        <span className="text-right font-medium text-text-primary">{investment.startup.teamSize}</span>
        <span className="text-text-secondary">Monthly revenue</span>
        <span className="text-right font-medium text-text-primary">
          {investment.startup.traction?.monthlyRevenueAmount
            ? formatCompactMoney(investment.startup.traction.monthlyRevenueAmount, investment.startup.currency)
            : "—"}
        </span>
        <span className="text-text-secondary">Growth rate</span>
        <span className="text-right font-medium text-text-primary">
          {investment.startup.traction?.growthRatePercent != null ? `${investment.startup.traction.growthRatePercent}%` : "—"}
        </span>
        {investment.amount != null && (
          <>
            <span className="text-text-secondary">Invested amount</span>
            <span className="text-right font-medium text-text-primary">{formatCompactMoney(investment.amount, investment.currency)}</span>
          </>
        )}
        {isExited && investment.exitValueAmount != null && (
          <>
            <span className="text-text-secondary">Exit value</span>
            <span className="text-right font-medium text-text-primary">{formatCompactMoney(investment.exitValueAmount, investment.currency)}</span>
          </>
        )}
        {investment.nextFollowUpAt && (
          <>
            <span className="text-text-secondary">Next follow-up</span>
            <span className="text-right font-medium text-text-primary">{formatRelativeTime(investment.nextFollowUpAt)}</span>
          </>
        )}
      </div>

      <Link href={`/startups/${investment.startup.slug}`} className="text-xs font-medium text-brand-primary hover:underline">
        View latest updates →
      </Link>

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <Input
          label="Follow-up date"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="max-w-40"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!followUpDate}
          isLoading={setFollowUp.isPending}
          onClick={() => {
            setFollowUp.mutate({ startupId: investment.startupId, input: { nextFollowUpAt: new Date(followUpDate).toISOString() } });
            setFollowUpDate("");
          }}
        >
          Set follow-up
        </Button>
        {!isExited && (
          <>
            <Input label="Exit value (₹)" type="number" value={exitValue} onChange={(e) => setExitValue(e.target.value)} className="max-w-32" />
            <Button
              size="sm"
              variant="secondary"
              isLoading={recordExit.isPending}
              onClick={() => {
                recordExit.mutate({ startupId: investment.startupId, input: { exitValueAmount: exitValue ? Number(exitValue) : undefined } });
                setExitValue("");
              }}
            >
              Record exit
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export default function PortfolioPage() {
  const { data: investments, isLoading } = usePortfolio();
  const { data: dashboard } = usePortfolioDashboard();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">My Portfolio</h1>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <p className="text-xs text-text-secondary">Total investments</p>
            <p className="font-numeric text-2xl font-bold text-text-primary">{dashboard.totalInvestments}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">Active</p>
            <p className="font-numeric text-2xl font-bold text-text-primary">{dashboard.activeInvestments}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">Exited</p>
            <p className="font-numeric text-2xl font-bold text-text-primary">{dashboard.exitedInvestments}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">Unrealised (deployed)</p>
            <p className="font-numeric text-xl font-bold text-text-primary">{formatCompactMoney(dashboard.unrealisedAmount, "INR")}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">Realised</p>
            <p className="font-numeric text-xl font-bold text-text-primary">{formatCompactMoney(dashboard.realisedAmount, "INR")}</p>
          </Card>
        </div>
      )}

      {dashboard && (dashboard.recentTrustImprovements.length > 0 || dashboard.upcomingFollowUps.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <TrendingUp className="h-4 w-4 text-brand-primary" />
              <CardTitle className="text-base">Recent trust improvements</CardTitle>
            </CardHeader>
            {dashboard.recentTrustImprovements.length > 0 ? (
              <ul className="flex flex-col gap-1 text-xs text-text-secondary">
                {dashboard.recentTrustImprovements.map((imp) => (
                  <li key={imp.startupId}>
                    {imp.from} → {imp.to}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-secondary">No recent changes.</p>
            )}
          </Card>
          <Card className="flex flex-col gap-2">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <CalendarClock className="h-4 w-4 text-brand-primary" />
              <CardTitle className="text-base">Upcoming follow-ups</CardTitle>
            </CardHeader>
            {dashboard.upcomingFollowUps.length > 0 ? (
              <ul className="flex flex-col gap-1 text-xs text-text-secondary">
                {dashboard.upcomingFollowUps.map((f) => (
                  <li key={f.id}>
                    {f.startup.name}: {f.nextFollowUpAt && formatRelativeTime(f.nextFollowUpAt)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-secondary">Nothing scheduled.</p>
            )}
          </Card>
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton />
      ) : investments && investments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => (
            <PortfolioCard key={investment.id} investment={investment} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No portfolio companies yet" description="Move a pipeline entry to Closed to see it here." />
      )}
    </div>
  );
}
