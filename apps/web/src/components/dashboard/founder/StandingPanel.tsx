"use client";

import type { StartupHealth } from "@vittamhub/types";
import { Badge, Card, ProgressBar } from "@vittamhub/ui";
import { CheckCircle2, Circle, Gauge } from "lucide-react";

import { PanelTitle } from "../PageHeader";

import { scoreBand } from "./score-band";

type Factor = StartupHealth["trustScore"]["factors"][number];

function Score({
  label,
  score,
  band,
  note,
  factors,
}: {
  label: string;
  score: number;
  band: string;
  note: string;
  factors: Factor[];
}) {
  const meta = scoreBand(band);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="body-5 text-text-primary">{label}</span>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>
      <p className="flex items-baseline gap-1">
        <span className="font-numeric text-3xl font-semibold text-text-primary">{score}</span>
        <span className="caption-2">/ 100</span>
      </p>
      <ProgressBar value={score} />
      <details className="group">
        <summary className="caption-4 cursor-pointer list-none text-brand-700 transition-colors duration-300 ease-base hover:text-brand-800 dark:text-brand-300 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">See what counts</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <p className="caption-5 mt-2">{note}</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {factors.map((factor) => (
            <li key={factor.key} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                {factor.earned ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-600" aria-label="Earned" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" aria-label="Not yet" />
                )}
                <span className={factor.earned ? "truncate text-text-primary" : "truncate text-text-secondary"}>{factor.label}</span>
              </span>
              <span className="font-numeric text-text-secondary">+{factor.weight}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/**
 * Where the startup stands, in one panel instead of three separate cards:
 * the Trust Score investors see, the founder's own reputation and how
 * complete the profile is. Each score folds open to show what makes it up.
 */
export function StandingPanel({ health }: { health: StartupHealth }) {
  return (
    <Card className="flex h-full flex-col gap-6">
      <PanelTitle icon={Gauge} title="Your standing" />
      <Score
        label="Trust score"
        score={health.trustScore.score}
        band={health.trustScore.band}
        note="What investors see first. It rises only when you add something they can check."
        factors={health.trustScore.factors}
      />
      <div className="h-px bg-border" aria-hidden="true" />
      <Score
        label="Founder reputation"
        score={health.founderReputation.score}
        band={health.founderReputation.band}
        note="Your professional credibility as a founder. It is not a social score."
        factors={health.founderReputation.factors}
      />
    </Card>
  );
}
