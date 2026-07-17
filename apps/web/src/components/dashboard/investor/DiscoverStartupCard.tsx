"use client";

import { useAddToPipeline, useFollowStartup, type StartupSearchResultItem } from "@vittamhub/api-client";
import { Badge, Button, Card } from "@vittamhub/ui";
import { formatCompactUsd, formatRelativeTime } from "@vittamhub/utils";
import { Bookmark, Handshake, ShieldCheck, Sparkles } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  IDEA: "Idea",
  VALIDATION: "Validation",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  CUSTOMERS: "Early customers",
  REVENUE: "Revenue",
  FUNDED: "Funded",
  SCALING: "Scaling",
  UNICORN: "Unicorn",
};

interface DiscoverStartupCardProps {
  startup: StartupSearchResultItem;
  selectedForCompare: boolean;
  onToggleCompare: () => void;
  onQuickView: () => void;
}

export function DiscoverStartupCard({ startup, selectedForCompare, onToggleCompare, onQuickView }: DiscoverStartupCardProps) {
  const followStartup = useFollowStartup();
  const addToPipeline = useAddToPipeline();

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {startup.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, user-uploaded logo URL
            <img src={startup.logoUrl} alt="" className="h-10 w-10 rounded-card object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-card bg-brand-100 font-heading text-xs font-bold text-brand-700">
              {startup.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-heading text-sm font-semibold text-text-primary">{startup.name}</h3>
            <p className="truncate text-xs text-text-secondary">{startup.owner.fullName}</p>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-secondary">
          <input type="checkbox" checked={selectedForCompare} onChange={onToggleCompare} className="h-3.5 w-3.5" />
          Compare
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="brand">{startup.industry}</Badge>
        <Badge variant="neutral">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
        <Badge variant="neutral">{startup.headquarters ?? startup.location}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-card bg-background-secondary p-3 text-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
          <span className="text-text-secondary">Trust</span>
          <span className="ml-auto font-numeric font-semibold text-text-primary">{startup.trustScore.score}</span>
        </div>
        {startup.matchScore && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            <span className="text-text-secondary">Match</span>
            <span className="ml-auto font-numeric font-semibold text-text-primary">{startup.matchScore.score}%</span>
          </div>
        )}
        <div className="col-span-2 flex items-center justify-between text-text-secondary">
          <span>{startup.funding?.fundingGoalUsd ? `Raising ${formatCompactUsd(startup.funding.fundingGoalUsd)}` : "Funding TBD"}</span>
          <span>{startup.traction?.monthlyRevenueUsd ? "Revenue generating" : "Pre-revenue"}</span>
        </div>
      </div>

      <p className="text-xs text-text-secondary">Updated {formatRelativeTime(startup.updatedAt)}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button size="sm" variant="ghost" onClick={onQuickView}>
          Quick view
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => followStartup.mutate({ startupId: startup.id, notifyOnUpdate: false })}
            isLoading={followStartup.isPending}
          >
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => addToPipeline.mutate({ startupId: startup.id, stage: "INTERESTED" })}
            isLoading={addToPipeline.isPending}
          >
            <Handshake className="h-3.5 w-3.5" /> Connect
          </Button>
        </div>
      </div>
    </Card>
  );
}
