"use client";

import { useStartupSearch, type StartupSearchResultItem } from "@vittamhub/api-client";
import type { StartupSearchFilters } from "@vittamhub/types";
import { Button, EmptyState } from "@vittamhub/ui";
import { Compass, Layers } from "lucide-react";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { CompareStartupsDialog } from "@/components/dashboard/investor/CompareStartupsDialog";
import { DiscoverStartupCard } from "@/components/dashboard/investor/DiscoverStartupCard";
import { QuickViewDialog } from "@/components/dashboard/investor/QuickViewDialog";
import { StartupDiscoveryFilters } from "@/components/dashboard/investor/StartupDiscoveryFilters";

export default function DiscoverStartupsPage() {
  const [filters, setFilters] = useState<StartupSearchFilters>({ matchMyPreferences: true, page: 1, pageSize: 20 });
  const { data, isLoading } = useStartupSearch(filters);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [quickViewStartup, setQuickViewStartup] = useState<StartupSearchResultItem | null>(null);

  const items = data?.items ?? [];
  const compareStartups = items.filter((s) => compareIds.includes(s.id));

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((c) => c !== id);
      if (current.length >= 3) return current; // keep comparisons readable
      return [...current, id];
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Discover Startups</h1>
        {compareIds.length > 1 && (
          <Button size="sm" onClick={() => setCompareOpen(true)}>
            <Layers className="h-3.5 w-3.5" /> Compare ({compareIds.length})
          </Button>
        )}
      </div>

      <StartupDiscoveryFilters filters={filters} onChange={(next) => setFilters({ ...next, page: 1 })} />

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((startup) => (
            <DiscoverStartupCard
              key={startup.id}
              startup={startup}
              selectedForCompare={compareIds.includes(startup.id)}
              onToggleCompare={() => toggleCompare(startup.id)}
              onQuickView={() => setQuickViewStartup(startup)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={Compass} title="No startups match yet" description="Try widening your filters, or check back as more founders publish profiles." />
      )}

      <QuickViewDialog startup={quickViewStartup} onOpenChange={(open) => !open && setQuickViewStartup(null)} />
      <CompareStartupsDialog startups={compareStartups} open={compareOpen} onOpenChange={setCompareOpen} />
    </div>
  );
}
