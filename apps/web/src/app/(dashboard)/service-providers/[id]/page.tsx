"use client";

import { useServiceProvider } from "@vittamhub/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@vittamhub/ui";
import { useParams } from "next/navigation";

export default function ServiceProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: provider, isLoading } = useServiceProvider(params.id);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!provider) return <p className="text-sm text-text-secondary">Service provider not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {provider.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL
          <img src={provider.logoUrl} alt="" className="h-14 w-14 rounded-card object-cover" />
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">{provider.companyName}</h1>
          {provider.pricingModel && <p className="text-sm text-text-secondary">{provider.pricingModel}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {provider.categories.map((category) => (
          <Badge key={category} variant="brand">
            {category}
          </Badge>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader className="pb-0">
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-text-secondary">
          {provider.description ? <p>{provider.description}</p> : <p>No description provided yet.</p>}
          <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
            {provider.yearsExperience !== null && <span>{provider.yearsExperience} years experience</span>}
            {provider.clientsServed !== null && <span>{provider.clientsServed} clients served</span>}
          </div>
          {provider.website && (
            <a href={provider.website} target="_blank" rel="noreferrer" className="mt-2 font-semibold text-brand-primary hover:underline">
              Visit website
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
