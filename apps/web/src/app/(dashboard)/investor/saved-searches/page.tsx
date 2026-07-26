"use client";

import {
  useCreateSavedSearch,
  useMarkSavedSearchViewed,
  useNewMatchesCount,
  useRemoveSavedSearch,
  useRunSavedSearch,
  useSavedSearches,
} from "@vittamhub/api-client";
import { Industry, StartupStage, type CreateSavedSearchInput } from "@vittamhub/types";
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Input, Select, Skeleton } from "@vittamhub/ui";
import { ChevronDown, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const INDUSTRY_OPTIONS = [{ label: "Any industry", value: "" }, ...Object.values(Industry).map((v) => ({ label: titleCase(v), value: v }))];
const STAGE_OPTIONS = [{ label: "Any stage", value: "" }, ...Object.values(StartupStage).map((v) => ({ label: titleCase(v), value: v }))];

function NewSearchCard() {
  const createSearch = useCreateSavedSearch();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [isFundraising, setIsFundraising] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    const filters: CreateSavedSearchInput["filters"] = {
      ...(industry ? { industry: [industry as Industry] } : {}),
      ...(stage ? { stage: [stage as StartupStage] } : {}),
      ...(isFundraising ? { isFundraising: true } : {}),
    };
    createSearch.mutate({ name: name.trim(), filters, notify: true });
    setName("");
    setIndustry("");
    setStage("");
    setIsFundraising(false);
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary">Save a search</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" placeholder='e.g. "Seed SaaS India"' value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Industry" options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} />
        <Select label="Stage" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
        <div className="flex items-end pb-2">
          <Checkbox checked={isFundraising} onCheckedChange={setIsFundraising} label="Currently raising only" />
        </div>
      </div>
      <Button size="sm" className="w-fit" onClick={handleCreate} isLoading={createSearch.isPending} disabled={!name.trim()}>
        Save search
      </Button>
    </Card>
  );
}

function SavedSearchRow({ id, name }: { id: string; name: string }) {
  const [expanded, setExpanded] = useState(false);
  const removeSearch = useRemoveSavedSearch();
  const markViewed = useMarkSavedSearchViewed();
  const { data: newCount } = useNewMatchesCount(id);
  const { data: results, isLoading, isError } = useRunSavedSearch(id);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{name}</h3>
          {newCount && newCount.count > 0 && <Badge variant="brand">{newCount.count} new</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded((v) => !v);
              if (!expanded) markViewed.mutate(id);
            }}
            className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
          >
            {expanded ? "Hide" : "Open"} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <button type="button" onClick={() => removeSearch.mutate(id)} className="text-text-secondary hover:text-danger-600" aria-label="Delete search">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border pt-3">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ) : isError ? (
            <ErrorState className="py-4" />
          ) : results && results.items.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {results.items.map((startup) => (
                <li key={startup.id}>
                  <Link href={`/startups/${startup.slug}`} className="text-sm font-medium text-text-primary hover:text-brand-primary hover:underline">
                    {startup.name}
                  </Link>
                  <span className="ml-2 text-xs text-text-secondary">{titleCase(startup.industry)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-secondary">No matches yet.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function SavedSearchesPage() {
  const { data: searches, isLoading, isError } = useSavedSearches();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Saved searches</h1>
        <p className="mt-1 text-sm text-text-secondary">Every search automatically updates, see how many new startups match since you last checked.</p>
      </div>

      <NewSearchCard />

      {isLoading ? (
        <ListRowsSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : searches && searches.length > 0 ? (
        <div className="flex flex-col gap-3">
          {searches.map((search) => (
            <SavedSearchRow key={search.id} id={search.id} name={search.name} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Search} title="No saved searches yet" description="Save a filter set above to get notified when new startups match." />
      )}
    </div>
  );
}
