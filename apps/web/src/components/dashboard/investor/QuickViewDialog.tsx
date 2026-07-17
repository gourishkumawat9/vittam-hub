"use client";

import type { StartupSearchResultItem } from "@vittamhub/api-client";
import { Badge, Button, Dialog } from "@vittamhub/ui";
import { formatCompactUsd } from "@vittamhub/utils";
import Link from "next/link";

interface QuickViewDialogProps {
  startup: StartupSearchResultItem | null;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewDialog({ startup, onOpenChange }: QuickViewDialogProps) {
  if (!startup) return null;

  return (
    <Dialog
      open={!!startup}
      onOpenChange={onOpenChange}
      title={startup.name}
      description={startup.tagline}
      footer={
        <Button asChild>
          <Link href={`/startups/${startup.slug}`}>View full profile</Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{startup.description}</p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="brand">{startup.industry}</Badge>
          <Badge variant="neutral">{startup.headquarters ?? startup.location}</Badge>
          <Badge variant="neutral">Founded {startup.foundedYear}</Badge>
          <Badge variant="neutral">{startup.teamSize} people</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-card bg-background-secondary p-3 text-xs">
          <span className="text-text-secondary">Founder</span>
          <span className="text-right font-medium text-text-primary">{startup.owner.fullName}</span>
          <span className="text-text-secondary">Funding requirement</span>
          <span className="text-right font-medium text-text-primary">
            {startup.funding?.fundingGoalUsd ? formatCompactUsd(startup.funding.fundingGoalUsd) : "Not specified"}
          </span>
          <span className="text-text-secondary">Revenue status</span>
          <span className="text-right font-medium text-text-primary">
            {startup.traction?.monthlyRevenueUsd ? "Revenue generating" : "Pre-revenue"}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Trust Score — {startup.trustScore.score}</h4>
          <ul className="mt-2 flex flex-col gap-1">
            {startup.trustScore.factors.map((factor) => (
              <li key={factor.key} className="flex items-center justify-between text-xs text-text-secondary">
                <span>{factor.label}</span>
                <span className={factor.earned ? "text-success-600" : "text-text-secondary"}>{factor.earned ? "Yes" : "No"}</span>
              </li>
            ))}
          </ul>
        </div>

        {startup.matchScore && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Match Score — {startup.matchScore.score}%</h4>
            <ul className="mt-2 flex flex-col gap-1">
              {startup.matchScore.reasons.map((reason) => (
                <li key={reason.key} className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{reason.label}</span>
                  <span className={reason.matched ? "text-success-600" : "text-text-secondary"}>{reason.matched ? "Yes" : "No"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}
