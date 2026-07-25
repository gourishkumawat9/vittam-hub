"use client";

import type { TrustV2Preview } from "@vittamhub/types";
import { Badge, Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { ArrowRight, FlaskConical } from "lucide-react";
import { useState } from "react";

function scoreColor(score: number) {
  if (score >= 65) return "text-success-600";
  if (score >= 25) return "text-warning-600";
  return "text-danger-600";
}

const BAND_BADGE_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Platinum: "success",
  Gold: "success",
  Silver: "warning",
  Bronze: "warning",
  Starting: "danger",
};

/**
 * Preview of Trust Score v2 (verification-only model, trust-model.ts) —
 * founder-only, doesn't affect what anyone else sees (that's still v1 via
 * TrustScoreCard until the deliberate FF_TRUST_V2 cutover). Labeled as a
 * preview so it never reads as a second, conflicting "real" score.
 */
export function TrustScoreV2PreviewCard({ preview }: { preview: TrustV2Preview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col gap-4 border-dashed">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-brand-primary" /> Trust Score (verification-only preview)
        </CardTitle>
        <Badge variant={BAND_BADGE_VARIANT[preview.band] ?? "neutral"}>{preview.band}</Badge>
      </CardHeader>

      <p className="text-xs text-text-secondary">
        An early look at a stricter model: only verified facts count, never anything just typed. Not shown to investors yet.
      </p>

      <div className="flex items-center gap-4">
        <span className={`font-numeric text-4xl font-bold ${scoreColor(preview.score)}`}>{preview.score}</span>
        <span className="text-sm text-text-secondary">out of 100 · stage {preview.stage}</span>
      </div>

      {preview.nextBestActions.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-text-primary">Next best actions</span>
          <ul className="flex flex-col gap-1.5">
            {preview.nextBestActions.map((action) => (
              <li key={action.key} className="flex items-start gap-2 text-xs text-text-secondary">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
                <span>
                  {action.suggestion} <span className="text-text-tertiary">(+{action.gap} pts)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left text-xs font-medium text-brand-primary hover:underline">
        {expanded ? "Hide full breakdown" : "See full breakdown"}
      </button>

      {expanded && (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
          {preview.components.map((component) => {
            const applicableMax = Math.round(component.max * component.applicability);
            return (
              <li key={component.key} className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{component.label}</span>
                <span className="text-text-secondary">
                  {Math.round(component.earned)} / {applicableMax}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
