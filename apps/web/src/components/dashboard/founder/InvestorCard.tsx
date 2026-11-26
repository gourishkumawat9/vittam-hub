"use client";

import type { InvestorWithOwner } from "@vittamhub/api-client";
import { Badge, Button, Card } from "@vittamhub/ui";
import { formatCompactMoney } from "@vittamhub/utils";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { INDUSTRY_LABEL } from "@/lib/startup-options";

/**
 * One investor in the founder's lists: who they are, what they back, and a
 * Connect button. `preview` shows the investor their own card, button inert.
 */
export function InvestorCard({
  investor,
  onConnect,
  preview = false,
}: {
  investor: InvestorWithOwner;
  onConnect?: (investor: InvestorWithOwner) => void;
  preview?: boolean;
}) {
  const responseRate = investor.metrics?.responseRate;
  const responseHours = investor.metrics?.avgResponseTimeHours;
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="title-3 truncate">{investor.owner.fullName}</h3>
            <VerifiedBadge status={investor.verificationStatus} />
          </div>
          <p className="caption-5 truncate">{investor.firmName ?? "Independent investor"}</p>
        </div>
        <Badge variant={investor.openForPitches ? "success" : "neutral"}>{investor.openForPitches ? "Open for pitches" : "Not reviewing"}</Badge>
      </div>

      {investor.bio && <p className="body-6 line-clamp-3 text-text-secondary">{investor.bio}</p>}

      <div className="flex flex-wrap gap-1.5">
        {investor.preferredIndustries.slice(0, 4).map((industry) => (
          <Badge key={industry} variant="neutral">
            {INDUSTRY_LABEL[industry] ?? industry}
          </Badge>
        ))}
        {investor.trust && investor.trust.band !== "STARTING" && <Badge variant="brand">{investor.trust.band.charAt(0) + investor.trust.band.slice(1).toLowerCase()} trust</Badge>}
      </div>

      {(responseRate != null || investor.metrics?.isActive) && (
        <p className="caption-5">
          {[
            responseRate != null ? `Replies to ${Math.round(responseRate * 100)}% of requests` : null,
            responseHours != null ? `usually within ${Math.round(responseHours)}h` : null,
            investor.metrics?.isActive ? "active recently" : null,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="flex flex-col">
          <span className="caption-5">Ticket size</span>
          <span className="font-numeric text-sm font-semibold text-text-primary">
            {formatCompactMoney(Number(investor.checkSizeMinAmount), investor.currency)} to{" "}
            {formatCompactMoney(Number(investor.checkSizeMaxAmount), investor.currency)}
          </span>
        </span>
        <Button size="sm" onClick={() => onConnect?.(investor)} disabled={preview || !investor.openForPitches} tabIndex={preview ? -1 : undefined}>
          Send connect request
        </Button>
      </div>
    </Card>
  );
}
