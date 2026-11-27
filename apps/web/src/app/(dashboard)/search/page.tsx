"use client";

import { useCurrentUser, useGlobalSearch } from "@vittamhub/api-client";
import { Avatar, Badge, Card, EmptyState, ErrorState, Input } from "@vittamhub/ui";
import { Building2, ChevronRight, Compass, GraduationCap, School, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelLink } from "@/components/dashboard/PageHeader";
import { INVESTOR_TYPE_LABEL } from "@/lib/signup-options";
import { INDUSTRY_LABEL, STAGE_LABEL } from "@/lib/startup-options";
import { cn } from "@/lib/utils";

type Group = "startups" | "investors" | "mentors" | "incubators" | "universities";

const GROUPS: { id: Group; label: string; icon: typeof Search }[] = [
  { id: "startups", label: "Startups", icon: Building2 },
  { id: "investors", label: "Investors", icon: TrendingUp },
  { id: "mentors", label: "Mentors", icon: GraduationCap },
  { id: "incubators", label: "Incubators", icon: Compass },
  { id: "universities", label: "Universities", icon: School },
];

/** One result: an avatar, a name and a line under it, and a link when there's a page to open. */
function ResultRow({
  href,
  name,
  image,
  square,
  subtitle,
  badges,
}: {
  href?: string;
  name: string;
  image?: string | null;
  square?: boolean;
  subtitle?: string | null;
  badges?: React.ReactNode;
}) {
  const body = (
    <>
      <Avatar name={name} src={image} size="md" className={square ? "rounded-button" : undefined} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="body-5 truncate text-text-primary group-hover:text-brand-primary">{name}</span>
        {subtitle && <span className="caption-5 line-clamp-1">{subtitle}</span>}
      </span>
      {badges && <span className="hidden shrink-0 flex-wrap items-center gap-1.5 sm:flex">{badges}</span>}
      {href && <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background-secondary sm:px-5">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">{body}</div>
      )}
    </li>
  );
}

function ResultSection({ id, title, icon: Icon, seeAll, children }: { id: string; title: string; icon: typeof Search; seeAll?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="title-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-text-secondary" aria-hidden="true" /> {title}
        </h2>
        {seeAll && <PanelLink href={seeAll.href}>{seeAll.label}</PanelLink>}
      </div>
      <Card className="overflow-hidden p-0">
        <ul className="flex flex-col divide-y divide-border">{children}</ul>
      </Card>
    </section>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("query") ?? "";
  const [draft, setDraft] = useState(query);
  const [only, setOnly] = useState<Group | null>(null);
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useGlobalSearch({ query }, query.trim().length > 0);

  // A new search from the top bar starts with every group showing again.
  useEffect(() => {
    setDraft(query);
    setOnly(null);
  }, [query]);

  const counts: Record<Group, number> = {
    startups: data?.startups.length ?? 0,
    investors: data?.investors.length ?? 0,
    mentors: data?.mentors.length ?? 0,
    incubators: data?.incubators.length ?? 0,
    universities: data?.universities?.length ?? 0,
  };
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const shows = (group: Group) => counts[group] > 0 && (only === null || only === group);
  const isFounder = user?.role === "FOUNDER";
  const isInvestor = user?.role === "INVESTOR";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Search"
        description="Startups, investors, mentors, incubators and universities on VittamHub. The top five in each group show here; each directory has the rest."
      />

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft.trim();
          if (next) router.push(`/search?query=${encodeURIComponent(next)}`);
        }}
        className="relative w-full sm:max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
        <Input aria-label="Search VittamHub" placeholder="A name, an industry or a keyword" value={draft} onChange={(event) => setDraft(event.target.value)} className="pl-9" />
      </form>

      {!query.trim() ? (
        <EmptyState icon={Search} title="Search VittamHub" description="Try a startup's name, an industry such as fintech, or a skill such as pricing." />
      ) : isLoading ? (
        <ListRowsSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : total === 0 ? (
        <EmptyState icon={Search} title={`Nothing found for “${query}”`} description="Try a different name, an industry, or a shorter keyword." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show results for">
            {[{ id: null, label: "All", count: total } as const, ...GROUPS.filter((g) => counts[g.id] > 0).map((g) => ({ id: g.id, label: g.label, count: counts[g.id] }))].map(
              (chip) => {
                const active = only === chip.id;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setOnly(chip.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-brand-primary bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                        : "border-border text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {chip.label}
                    <span className="font-numeric opacity-70">{chip.count}</span>
                  </button>
                );
              },
            )}
          </div>

          <div className="flex flex-col gap-8">
            {shows("startups") && (
              <ResultSection id="startups" title="Startups" icon={Building2} seeAll={isInvestor ? { href: "/investor/discover", label: "Discover startups" } : undefined}>
                {data!.startups.map((startup) => (
                  <ResultRow
                    key={startup.id}
                    href={`/startups/${startup.slug}`}
                    name={startup.name}
                    image={startup.logoUrl}
                    square
                    subtitle={startup.tagline}
                    badges={
                      <>
                        <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
                        <Badge variant="neutral">{INDUSTRY_LABEL[startup.industry] ?? startup.industry}</Badge>
                      </>
                    }
                  />
                ))}
              </ResultSection>
            )}

            {shows("investors") && (
              <ResultSection id="investors" title="Investors" icon={TrendingUp} seeAll={isFounder ? { href: "/founder/investors", label: "Send a connect request" } : undefined}>
                {data!.investors.map((investor) => (
                  <ResultRow
                    key={investor.id}
                    href={isFounder ? "/founder/investors" : undefined}
                    name={investor.firmName ?? investor.owner.fullName}
                    image={investor.owner.avatarUrl}
                    subtitle={[INVESTOR_TYPE_LABEL[investor.investorType] ?? investor.investorType, investor.location].filter(Boolean).join(" · ")}
                    badges={investor.openForPitches ? <Badge variant="success">Open for pitches</Badge> : undefined}
                  />
                ))}
              </ResultSection>
            )}

            {shows("mentors") && (
              <ResultSection id="mentors" title="Mentors" icon={GraduationCap} seeAll={{ href: "/mentors", label: "All mentors" }}>
                {data!.mentors.map((mentor) => (
                  <ResultRow
                    key={mentor.id}
                    href={`/mentors/${mentor.id}`}
                    name={mentor.owner.fullName}
                    image={mentor.owner.avatarUrl}
                    subtitle={mentor.headline}
                    badges={mentor.expertise.slice(0, 2).map((skill) => (
                      <Badge key={skill} variant="brand">
                        {skill}
                      </Badge>
                    ))}
                  />
                ))}
              </ResultSection>
            )}

            {shows("incubators") && (
              <ResultSection id="incubators" title="Incubators" icon={Compass} seeAll={{ href: "/incubators", label: "All incubators" }}>
                {data!.incubators.map((incubator) => (
                  <ResultRow
                    key={incubator.id}
                    href={`/incubators/${incubator.id}`}
                    name={incubator.organizationName}
                    image={incubator.logoUrl}
                    square
                    subtitle={incubator.description}
                  />
                ))}
              </ResultSection>
            )}

            {shows("universities") && (
              <ResultSection id="universities" title="Universities" icon={School} seeAll={{ href: "/universities", label: "All universities" }}>
                {data!.universities.map((university) => (
                  <ResultRow
                    key={university.id}
                    href={`/universities/${university.id}`}
                    name={university.institutionName}
                    image={university.logoUrl}
                    square
                    subtitle={university.incubationCellName ?? university.affiliationType}
                  />
                ))}
              </ResultSection>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
