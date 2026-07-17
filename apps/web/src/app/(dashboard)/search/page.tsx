"use client";

import { useGlobalSearch } from "@vittamhub/api-client";
import { Badge, Card, EmptyState } from "@vittamhub/ui";
import { Building2, Compass, GraduationCap, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const { data, isLoading } = useGlobalSearch({ query }, query.trim().length > 0);

  const hasResults =
    !!data && (data.startups.length > 0 || data.investors.length > 0 || data.mentors.length > 0 || data.incubators.length > 0 || data.jobs.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Search results</h1>
        <p className="text-sm text-text-secondary">Showing results for &ldquo;{query}&rdquo;</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Searching…</p>
      ) : !hasResults ? (
        <EmptyState icon={Search} title="No results found" description="Try a different name, industry, or keyword." />
      ) : (
        <div className="flex flex-col gap-6">
          {data!.startups.length > 0 && (
            <SearchSection icon={Building2} title="Startups">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.startups.map((startup) => (
                  <Link key={startup.id} href={`/startups/${startup.slug}`}>
                    <Card interactive className="flex flex-col gap-2">
                      <h3 className="font-heading text-sm font-semibold text-text-primary">{startup.name}</h3>
                      <p className="text-xs text-text-secondary">{startup.tagline}</p>
                      <Badge variant="brand">{startup.industry}</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </SearchSection>
          )}

          {data!.investors.length > 0 && (
            <SearchSection icon={TrendingUp} title="Investors">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.investors.map((investor) => (
                  <Card key={investor.id} className="flex flex-col gap-2">
                    <h3 className="font-heading text-sm font-semibold text-text-primary">{investor.firmName ?? investor.owner.fullName}</h3>
                    <p className="text-xs text-text-secondary">{investor.investorType}</p>
                  </Card>
                ))}
              </div>
            </SearchSection>
          )}

          {data!.mentors.length > 0 && (
            <SearchSection icon={GraduationCap} title="Mentors">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.mentors.map((mentor) => (
                  <Link key={mentor.id} href={`/mentors/${mentor.id}`}>
                    <Card interactive className="flex flex-col gap-2">
                      <h3 className="font-heading text-sm font-semibold text-text-primary">{mentor.owner.fullName}</h3>
                      <p className="text-xs text-text-secondary">{mentor.headline}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </SearchSection>
          )}

          {data!.incubators.length > 0 && (
            <SearchSection icon={Compass} title="Incubators">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.incubators.map((incubator) => (
                  <Link key={incubator.id} href={`/incubators/${incubator.id}`}>
                    <Card interactive className="flex flex-col gap-2">
                      <h3 className="font-heading text-sm font-semibold text-text-primary">{incubator.organizationName}</h3>
                      <p className="line-clamp-2 text-xs text-text-secondary">{incubator.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </SearchSection>
          )}

          {data!.jobs.length > 0 && (
            <SearchSection icon={Users} title="Jobs">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.jobs.map((job) => (
                  <Link key={job.id} href="/jobs">
                    <Card interactive className="flex flex-col gap-2">
                      <h3 className="font-heading text-sm font-semibold text-text-primary">{job.title}</h3>
                      <p className="text-xs text-text-secondary">{job.startup.name}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </SearchSection>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({ icon: Icon, title, children }: { icon: typeof Search; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-text-primary">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-secondary">Loading…</p>}>
      <SearchContent />
    </Suspense>
  );
}
