"use client";

import {
  useCreateSavedSearch,
  useMarkSavedSearchViewed,
  useNewMatchesCount,
  useRemoveSavedSearch,
  useRunSavedSearch,
  useSavedSearches,
} from "@vittamhub/api-client";
import { Industry, StartupStage, type CreateSavedSearchInput, type SavedSearch } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, Checkbox, EmptyState, ErrorState, Input, Select, Skeleton } from "@vittamhub/ui";
import { ChevronDown, Compass, Search, SearchCheck, Trash2 } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";
import { cn } from "@/lib/utils";

const INDUSTRY_OPTIONS = [{ label: "Any industry", value: "" }, ...Object.values(Industry).map((v) => ({ label: INDUSTRY_LABEL[v] ?? v, value: v }))];
const STAGE_OPTIONS = [{ label: "Any stage", value: "" }, ...Object.values(StartupStage).map((v) => ({ label: STAGE_LABEL[v] ?? v, value: v }))];

/** A saved search's filters as short chips, so each card reads as the search itself. */
function filterChips(filters: SavedSearch["filters"]) {
  const chips: string[] = [];
  if (filters.query) chips.push(`“${filters.query}”`);
  filters.industry?.forEach((v) => chips.push(INDUSTRY_LABEL[v] ?? v));
  filters.stage?.forEach((v) => chips.push(STAGE_LABEL[v] ?? v));
  if (filters.location) chips.push(filters.location);
  if (filters.isFundraising) chips.push("Raising now");
  if (filters.hasRevenue) chips.push("Has revenue");
  if (filters.verificationStatus?.includes("VERIFIED")) chips.push("Verified only");
  if (filters.matchMyPreferences) chips.push("Fits my preferences");
  return chips;
}

function NewSearchCard() {
  const createSearch = useCreateSavedSearch();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");
  const [isFundraising, setIsFundraising] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    const filters: CreateSavedSearchInput["filters"] = {
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(industry ? { industry: [industry as Industry] } : {}),
      ...(stage ? { stage: [stage as StartupStage] } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(isFundraising ? { isFundraising: true } : {}),
    };
    createSearch.mutate({ name: name.trim(), filters, notify: true });
    setName("");
    setQuery("");
    setIndustry("");
    setStage("");
    setLocation("");
    setIsFundraising(false);
  };

  return (
    <Card className="flex flex-col gap-4 lg:sticky lg:top-24">
      <PanelTitle icon={SearchCheck} title="New saved search" />
      <Input label="Name" placeholder="e.g. Seed SaaS, India" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Keyword (optional)" placeholder="e.g. payments" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Select label="Industry" placeholder="Any industry" options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} />
      <Select label="Stage" placeholder="Any stage" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
      <Input label="City (optional)" placeholder="e.g. Bengaluru" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Checkbox checked={isFundraising} onCheckedChange={setIsFundraising} label="Only startups that are raising now" />
      <Button onClick={handleCreate} isLoading={createSearch.isPending} disabled={!name.trim()}>
        Save search
      </Button>
    </Card>
  );
}

function SavedSearchCard({ search }: { search: SavedSearch }) {
  const [showAll, setShowAll] = useState(false);
  const removeSearch = useRemoveSavedSearch();
  const markViewed = useMarkSavedSearchViewed();
  const { data: newCount } = useNewMatchesCount(search.id);
  const { data: results, isLoading, isError } = useRunSavedSearch(search.id);
  const chips = filterChips(search.filters);
  const items = results?.items ?? [];
  const shown = showAll ? items : items.slice(0, 3);
  const fresh = newCount?.count ?? 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="title-2">{search.name}</h2>
            {fresh > 0 && <Badge variant="brand">{fresh} new</Badge>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.length > 0 ? (
              chips.map((chip) => (
                <span key={chip} className="rounded-full bg-background-secondary px-2.5 py-0.5 text-xs text-text-secondary">
                  {chip}
                </span>
              ))
            ) : (
              <span className="caption-5">Every listed startup</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {fresh > 0 && (
            <Button size="sm" variant="ghost" onClick={() => markViewed.mutate(search.id)} isLoading={markViewed.isPending}>
              Mark as seen
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => removeSearch.mutate(search.id)} isLoading={removeSearch.isPending} aria-label={`Delete ${search.name}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <ErrorState className="py-4" />
      ) : items.length > 0 ? (
        <>
          <ul className="flex flex-col divide-y divide-border rounded-button border border-border">
            {shown.map((startup) => (
                <li key={startup.id}>
                  <Link href={`/startups/${startup.slug}`} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-background-secondary">
                    <Avatar name={startup.name} src={startup.logoUrl} size="sm" className="rounded-button" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="body-5 truncate text-text-primary group-hover:text-brand-primary">{startup.name}</span>
                      <span className="caption-5 truncate">
                        {[STAGE_LABEL[startup.stage] ?? startup.stage, INDUSTRY_LABEL[startup.industry] ?? startup.industry, startup.headquarters ?? startup.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {startup.isFundraising && <Badge variant="success">Raising</Badge>}
                  </Link>
                </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="caption-5">
              {results!.totalItems} {results!.totalItems === 1 ? "startup matches" : "startups match"} · last looked {formatRelativeTime(search.lastViewedAt)}
            </span>
            {items.length > 3 && (
              <button
                type="button"
                onClick={() => {
                  if (!showAll && fresh > 0) markViewed.mutate(search.id);
                  setShowAll((v) => !v);
                }}
                aria-expanded={showAll}
                className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
              >
                {showAll ? "Show fewer" : `Show ${items.length === results!.totalItems ? "all" : "the first"} ${items.length}`}
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="caption-5 rounded-button bg-background-secondary px-3 py-3">No startup matches yet. New profiles that match show up here.</p>
      )}
    </Card>
  );
}

export default function SavedSearchesPage() {
  const { data: searches, isLoading, isError } = useSavedSearches();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saved searches"
        description="A search you save keeps running. Each one shows the startups that match it now, and how many joined since you last looked."
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link href="/investor/discover">
              <Compass className="h-4 w-4" aria-hidden="true" /> Discover startups
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isLoading ? (
            <ListRowsSkeleton />
          ) : isError ? (
            <ErrorState />
          ) : searches && searches.length > 0 ? (
            searches.map((search) => <SavedSearchCard key={search.id} search={search} />)
          ) : (
            <EmptyState icon={Search} title="No saved searches yet" description="Save one with the form and the startups that match it collect here." />
          )}
        </div>
        <div>
          <NewSearchCard />
        </div>
      </div>
    </div>
  );
}
