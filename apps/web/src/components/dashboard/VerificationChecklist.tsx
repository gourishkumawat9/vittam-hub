"use client";

import { useMyVerification } from "@vittamhub/api-client";
import { Card, ProgressBar, Skeleton } from "@vittamhub/ui";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

import { PanelLink, PanelTitle } from "./PageHeader";
import { TRUST_TIERS, TrustTierBadge } from "./TrustTierBadge";

/**
 * What this account still needs for the Verified badge, read from
 * GET /v1/verification/mine. Each met item shows its trust level honestly:
 * a detail the member typed is V0, one backed by an uploaded document is V1.
 * Nothing on the platform reaches V2 or V3 yet, so those only appear in the key.
 */
export function VerificationChecklist({ className }: { className?: string }) {
  const { data: progress, isLoading } = useMyVerification();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!progress) return null;

  const met = progress.requirements.filter((r) => r.met).length;
  const total = progress.requirements.length;
  const percent = total === 0 ? 100 : Math.round((met / total) * 100);

  return (
    <Card className={className}>
      <div className="flex flex-col gap-4">
        <PanelTitle
          icon={ShieldCheck}
          title="Verified badge"
          right={<span className="font-numeric text-sm font-semibold text-text-primary">{met} of {total}</span>}
        />
        <ProgressBar value={percent} />
        <ul className="flex flex-col gap-2">
          {progress.requirements.map((requirement) => (
            <li key={requirement.key} className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-start gap-2">
                {requirement.met ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" aria-label="Not yet" />
                )}
                <span className={requirement.met ? "body-6 text-text-primary" : "body-6 text-text-secondary"}>
                  {requirement.label}
                </span>
              </span>
              {requirement.met && <TrustTierBadge tier={requirement.documentType ? "V1" : "V0"} showLabel={false} />}
            </li>
          ))}
        </ul>
        <details className="group rounded-button bg-background-secondary px-3 py-2">
          <summary className="caption-4 cursor-pointer list-none text-text-primary">What V0 to V3 mean</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {(Object.keys(TRUST_TIERS) as (keyof typeof TRUST_TIERS)[]).map((tier) => (
              <li key={tier} className="flex items-start gap-2">
                <TrustTierBadge tier={tier} showLabel={false} />
                <span className="caption-5">
                  <span className="font-semibold text-text-primary">{TRUST_TIERS[tier].label}.</span> {TRUST_TIERS[tier].description}
                </span>
              </li>
            ))}
          </ul>
        </details>
        {met < total && <PanelLink href="/settings#verification">Add what&apos;s missing</PanelLink>}
      </div>
    </Card>
  );
}
