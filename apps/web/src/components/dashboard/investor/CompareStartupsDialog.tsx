"use client";

import type { StartupSearchResultItem } from "@vittamhub/api-client";
import { Badge, cn, Dialog, ProgressBar } from "@vittamhub/ui";
import { formatCompactUsd } from "@vittamhub/utils";

interface CompareStartupsDialogProps {
  startups: StartupSearchResultItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

type RowKind = "text" | "badge" | "badge-verification" | "progress";

interface Row {
  label: string;
  kind: RowKind;
  getValue: (s: StartupSearchResultItem) => string;
  getNumericValue?: (s: StartupSearchResultItem) => number | null;
}

const ROWS: Row[] = [
  { label: "Industry", kind: "text", getValue: (s) => s.industry },
  { label: "Stage", kind: "badge", getValue: (s) => STAGE_LABEL[s.stage] ?? s.stage },
  { label: "Business model", kind: "text", getValue: (s) => s.businessModelSummary ?? "—" },
  { label: "Location", kind: "text", getValue: (s) => s.headquarters ?? s.location },
  { label: "Founder", kind: "text", getValue: (s) => s.owner.fullName },
  {
    label: "Team size",
    kind: "text",
    getValue: (s) => String(s.teamSize),
    getNumericValue: (s) => s.teamSize,
  },
  {
    label: "Funding requirement",
    kind: "text",
    getValue: (s) => (s.funding?.fundingGoalUsd ? formatCompactUsd(s.funding.fundingGoalUsd) : "—"),
  },
  {
    label: "Monthly revenue",
    kind: "text",
    getValue: (s) => (s.traction?.monthlyRevenueUsd ? formatCompactUsd(s.traction.monthlyRevenueUsd) : "Pre-revenue"),
    getNumericValue: (s) => s.traction?.monthlyRevenueUsd ?? null,
  },
  {
    label: "Growth rate",
    kind: "text",
    getValue: (s) => (s.traction?.growthRatePercent != null ? `${s.traction.growthRatePercent}%` : "—"),
    getNumericValue: (s) => s.traction?.growthRatePercent ?? null,
  },
  {
    label: "Customers",
    kind: "text",
    getValue: (s) => (s.traction?.totalCustomers != null ? String(s.traction.totalCustomers) : "—"),
    getNumericValue: (s) => s.traction?.totalCustomers ?? null,
  },
  { label: "Verification", kind: "badge-verification", getValue: (s) => s.verificationStatus },
  {
    label: "Trust Score",
    kind: "progress",
    getValue: (s) => String(s.trustScore.score),
    getNumericValue: (s) => s.trustScore.score,
  },
  {
    label: "Match Score",
    kind: "progress",
    getValue: (s) => (s.matchScore ? String(s.matchScore.score) : "—"),
    getNumericValue: (s) => s.matchScore?.score ?? null,
  },
];

export function CompareStartupsDialog({ startups, open, onOpenChange }: CompareStartupsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Compare startups" className="max-w-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-text-secondary"> </th>
              {startups.map((s) => (
                <th key={s.id} className="p-2 text-left text-xs font-semibold text-text-primary">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const numericValues = row.getNumericValue ? startups.map((s) => row.getNumericValue!(s)) : [];
              const best = numericValues.some((v) => v != null) ? Math.max(...numericValues.filter((v): v is number => v != null)) : null;

              return (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-2 text-xs text-text-secondary">{row.label}</td>
                  {startups.map((s) => {
                    const isBest = best != null && row.getNumericValue?.(s) === best && numericValues.filter((v) => v === best).length < startups.length;
                    return (
                      <td key={s.id} className="p-2 text-xs">
                        {row.kind === "badge-verification" ? (
                          <Badge variant={s.verificationStatus === "VERIFIED" ? "success" : "neutral"}>{row.getValue(s)}</Badge>
                        ) : row.kind === "badge" ? (
                          <Badge variant="neutral">{row.getValue(s)}</Badge>
                        ) : row.kind === "progress" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ProgressBar value={row.getNumericValue?.(s) ?? 0} />
                            </div>
                            <span className={cn("text-text-primary", isBest && "font-semibold text-success-700")}>{row.getValue(s)}</span>
                          </div>
                        ) : (
                          <span className={cn("text-text-primary", isBest && "font-semibold text-success-700")}>{row.getValue(s)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}
