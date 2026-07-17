"use client";

import { useServiceProviders } from "@vittamhub/api-client";
import { ServiceCategory } from "@vittamhub/types";
import type { ServiceProviderSearchFilters } from "@vittamhub/types";
import { Badge, Card, EmptyState } from "@vittamhub/ui";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

const CATEGORY_OPTIONS = Object.values(ServiceCategory);

export default function ServiceProvidersDirectoryPage() {
  const [filters, setFilters] = useState<ServiceProviderSearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useServiceProviders(filters);
  const items = data?.items ?? [];

  function toggleCategory(category: ServiceCategory) {
    const current = filters.categories ?? [];
    const next = current.includes(category) ? current.filter((c) => c !== category) : [...current, category];
    setFilters({ ...filters, categories: next, page: 1 });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Service Providers</h1>
        <p className="text-sm text-text-secondary">Browse vetted legal, accounting, marketing and technology partners.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-card border border-border bg-surface p-4">
        {CATEGORY_OPTIONS.map((category) => {
          const active = (filters.categories ?? []).includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active ? "border-brand-primary bg-brand-primary text-white" : "border-border bg-transparent text-text-secondary"
              }`}
            >
              {category.replace("_", " ")}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((provider) => (
            <Link key={provider.id} href={`/service-providers/${provider.id}`}>
              <Card interactive className="flex h-full flex-col gap-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{provider.companyName}</h3>
                  {provider.pricingModel && <p className="text-xs text-text-secondary">{provider.pricingModel}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {provider.categories.slice(0, 4).map((category) => (
                    <Badge key={category} variant="brand">
                      {category.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
                {provider.description && <p className="line-clamp-2 text-sm text-text-secondary">{provider.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No service providers listed yet" description="Check back soon as service providers join VittamHub." />
      )}
    </div>
  );
}
