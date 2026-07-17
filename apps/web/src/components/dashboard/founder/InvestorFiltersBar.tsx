"use client";

import { InvestorType, StartupStage, type InvestorSearchFilters } from "@vittamhub/types";
import { Checkbox, Input, Select, TagsInput } from "@vittamhub/ui";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const SORT_OPTIONS = [
  { label: "Newest first", value: "createdAt:desc" },
  { label: "Recently active", value: "updatedAt:desc" },
];

const STAGE_OPTIONS = Object.values(StartupStage);
const INVESTOR_TYPE_OPTIONS = Object.values(InvestorType);

interface InvestorFiltersBarProps {
  filters: InvestorSearchFilters;
  onChange: (filters: InvestorSearchFilters) => void;
}

/** Filters for GET /v1/investors — industry/country/stage/ticket size/type, plus the "match my startup" default. */
export function InvestorFiltersBar({ filters, onChange }: InvestorFiltersBarProps) {
  const toggleStage = (stage: StartupStage) => {
    const current = filters.stage ?? [];
    onChange({ ...filters, stage: current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage] });
  };

  const toggleInvestorType = (type: InvestorType) => {
    const current = filters.investorType ?? [];
    onChange({
      ...filters,
      investorType: current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <TagsInput
          label="Industry"
          value={filters.industry ?? []}
          onChange={(industry) => onChange({ ...filters, industry })}
          placeholder="e.g. FinTech…"
        />
        <TagsInput
          label="Country"
          value={filters.country ?? []}
          onChange={(country) => onChange({ ...filters, country })}
          placeholder="e.g. India…"
        />
        <Input
          label="Min ticket size (USD)"
          type="number"
          value={filters.minTicketSizeUsd ?? ""}
          onChange={(e) => onChange({ ...filters, minTicketSizeUsd: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagsInput
          label="Portfolio companies"
          value={filters.portfolioCompanies ?? []}
          onChange={(portfolioCompanies) => onChange({ ...filters, portfolioCompanies })}
          placeholder="e.g. Razorpay…"
        />
        <Select
          label="Sort by"
          options={SORT_OPTIONS}
          value={`${filters.sortBy ?? "createdAt"}:${filters.sortDir ?? "desc"}`}
          onChange={(value) => {
            const [sortBy, sortDir] = value.split(":") as [InvestorSearchFilters["sortBy"], InvestorSearchFilters["sortDir"]];
            onChange({ ...filters, sortBy, sortDir });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Stage</span>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => toggleStage(stage)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                (filters.stage ?? []).includes(stage)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {titleCase(stage)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Investor type</span>
        <div className="flex flex-wrap gap-2">
          {INVESTOR_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleInvestorType(type)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                (filters.investorType ?? []).includes(type)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {titleCase(type)}
            </button>
          ))}
        </div>
      </div>

      <Checkbox
        checked={filters.matchMyStartup ?? true}
        onCheckedChange={(matchMyStartup) => onChange({ ...filters, matchMyStartup })}
        label="Prioritize investors matched to my startup's industry and stage"
      />
    </div>
  );
}
