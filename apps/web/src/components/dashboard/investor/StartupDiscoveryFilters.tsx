"use client";

import { CustomerModel, type StartupSearchFilters } from "@vittamhub/types";
import { Checkbox, Input, Select, TagsInput } from "@vittamhub/ui";
import { useState } from "react";

const SORT_OPTIONS = [
  { label: "Newest first", value: "createdAt:desc" },
  { label: "Oldest first", value: "createdAt:asc" },
  { label: "Recently updated", value: "updatedAt:desc" },
];

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const QUICK_TAGS = [
  "B2B",
  "B2C",
  "Marketplace",
  "SaaS",
  "DeepTech",
  "HealthTech",
  "FinTech",
  "EdTech",
  "AI",
  "Climate",
  "Hardware",
  "Consumer",
  "Social Impact",
  "Government",
];

const BUSINESS_MODEL_OPTIONS = Object.values(CustomerModel);

interface StartupDiscoveryFiltersProps {
  filters: StartupSearchFilters;
  onChange: (filters: StartupSearchFilters) => void;
}

export function StartupDiscoveryFilters({ filters, onChange }: StartupDiscoveryFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleTag = (tag: string) => {
    const current = filters.industry ?? [];
    onChange({ ...filters, industry: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag] });
  };

  const toggleBusinessModel = (model: CustomerModel) => {
    const current = filters.businessModel ?? [];
    onChange({ ...filters, businessModel: current.includes(model) ? current.filter((m) => m !== model) : [...current, model] });
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <Input
        placeholder="Search by name, founder, industry, or tag…"
        value={filters.query ?? ""}
        onChange={(e) => onChange({ ...filters, query: e.target.value || undefined })}
      />

      <div className="flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (filters.industry ?? []).includes(tag)
                ? "border-brand-primary bg-brand-100 text-brand-700"
                : "border-border text-text-secondary hover:bg-background-secondary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setExpanded((v) => !v)} className="self-start text-xs font-medium text-brand-primary hover:underline">
        {expanded ? "Hide advanced filters" : "Advanced filters"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Country / location"
              placeholder="e.g. India…"
              value={filters.location ?? ""}
              onChange={(e) => onChange({ ...filters, location: e.target.value || undefined })}
            />
            <Input
              label="Min funding requirement (USD)"
              type="number"
              value={filters.minFundingRequirementUsd ?? ""}
              onChange={(e) => onChange({ ...filters, minFundingRequirementUsd: e.target.value ? Number(e.target.value) : undefined })}
            />
            <TagsInput
              label="Technology"
              value={filters.technology ?? []}
              onChange={(technology) => onChange({ ...filters, technology })}
              placeholder="e.g. React, Postgres…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Founded after"
                type="number"
                value={filters.foundedYearMin ?? ""}
                onChange={(e) => onChange({ ...filters, foundedYearMin: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label="Founded before"
                type="number"
                value={filters.foundedYearMax ?? ""}
                onChange={(e) => onChange({ ...filters, foundedYearMax: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Team size min"
                type="number"
                value={filters.teamSizeMin ?? ""}
                onChange={(e) => onChange({ ...filters, teamSizeMin: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label="Team size max"
                type="number"
                value={filters.teamSizeMax ?? ""}
                onChange={(e) => onChange({ ...filters, teamSizeMax: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Min growth rate (%)"
              type="number"
              value={filters.growthRateMin ?? ""}
              onChange={(e) => onChange({ ...filters, growthRateMin: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              label="Min founder experience (years)"
              type="number"
              value={filters.founderExperienceMin ?? ""}
              onChange={(e) => onChange({ ...filters, founderExperienceMin: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Select
              label="Sort by"
              options={SORT_OPTIONS}
              value={`${filters.sortBy ?? "createdAt"}:${filters.sortDir ?? "desc"}`}
              onChange={(value) => {
                const [sortBy, sortDir] = value.split(":") as [StartupSearchFilters["sortBy"], StartupSearchFilters["sortDir"]];
                onChange({ ...filters, sortBy, sortDir });
              }}
            />
          </div>

          <Checkbox
            checked={(filters.verificationStatus ?? []).includes("PENDING")}
            onCheckedChange={(includePending) =>
              onChange({ ...filters, verificationStatus: includePending ? ["VERIFIED", "PENDING"] : undefined })
            }
            label="Also include startups pending verification"
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-primary">Business model</span>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_MODEL_OPTIONS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleBusinessModel(model)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    (filters.businessModel ?? []).includes(model)
                      ? "border-brand-primary bg-brand-100 text-brand-700"
                      : "border-border text-text-secondary hover:bg-background-secondary"
                  }`}
                >
                  {titleCase(model)}
                </button>
              ))}
            </div>
          </div>

          <Checkbox
            checked={filters.hasRevenue ?? false}
            onCheckedChange={(hasRevenue) => onChange({ ...filters, hasRevenue })}
            label="Only show startups with revenue"
          />

          <Checkbox
            checked={filters.matchMyPreferences ?? true}
            onCheckedChange={(matchMyPreferences) => onChange({ ...filters, matchMyPreferences })}
            label="Prioritize startups matched to my investment preferences"
          />
        </div>
      )}
    </div>
  );
}
