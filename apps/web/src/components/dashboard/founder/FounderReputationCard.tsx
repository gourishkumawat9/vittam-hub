"use client";

import type { FounderReputation } from "@vittamhub/types";
import { Badge, Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { Award, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

function scoreColor(score: number) {
  if (score >= 80) return "text-success-600";
  if (score >= 50) return "text-warning-600";
  return "text-danger-600";
}

const BAND_BADGE_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  EXCELLENT: "success",
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "danger",
};

/**
 * A separate axis from Trust Score — this measures the founder's own
 * professional credibility (activity, community participation, mentor
 * reviews, tenure), not whether the startup profile is complete/verified.
 * Always computed server-side (FounderReputationService).
 */
export function FounderReputationCard({ founderReputation }: { founderReputation: FounderReputation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-brand-primary" /> Founder Reputation
        </CardTitle>
        <Badge variant={BAND_BADGE_VARIANT[founderReputation.band] ?? "neutral"}>{founderReputation.band}</Badge>
      </CardHeader>

      <div className="flex items-center gap-4">
        <span className={`font-numeric text-4xl font-bold ${scoreColor(founderReputation.score)}`}>{founderReputation.score}</span>
        <span className="text-sm text-text-secondary">out of 100 — professional credibility, not a social score</span>
      </div>

      <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left text-xs font-medium text-brand-primary hover:underline">
        {expanded ? "Hide details" : "See what makes up your reputation"}
      </button>

      {expanded && (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
          {founderReputation.factors.map((factor) => (
            <li key={factor.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                {factor.earned ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-border" />
                )}
                <span className={factor.earned ? "text-text-primary" : "text-text-secondary"}>{factor.label}</span>
              </span>
              <span className="text-text-secondary">+{factor.weight}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
