"use client";

import { useGlobalSearch } from "@vittamhub/api-client";
import { Building2, Compass, GraduationCap, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isFetching } = useGlobalSearch({ query: debouncedQuery }, open && debouncedQuery.trim().length > 0);

  const hasResults =
    !!data && (data.startups.length > 0 || data.investors.length > 0 || data.mentors.length > 0 || data.incubators.length > 0 || data.jobs.length > 0);

  function goToFullResults() {
    if (!query.trim()) return;
    router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-button border border-border bg-background-secondary px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToFullResults();
          }}
          placeholder="Search startups, investors, mentors…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
      </div>

      {open && debouncedQuery.trim().length > 0 && (
        <div className="absolute left-0 top-11 z-dropdown w-full min-w-[22rem] rounded-card border border-border bg-surface shadow-lg">
          {isFetching ? (
            <p className="px-4 py-3 text-xs text-text-secondary">Searching…</p>
          ) : hasResults ? (
            <div className="flex max-h-96 flex-col gap-1 overflow-y-auto py-2">
              {data!.startups.length > 0 && (
                <ResultGroup icon={Building2} label="Startups">
                  {data!.startups.map((startup) => (
                    <ResultRow key={startup.id} href={`/startups/${startup.slug}`} onClick={() => setOpen(false)}>
                      {startup.name}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {data!.investors.length > 0 && (
                <ResultGroup icon={TrendingUp} label="Investors">
                  {data!.investors.map((investor) => (
                    <p key={investor.id} className="truncate px-2 py-1.5 text-sm text-text-primary">
                      {investor.firmName ?? investor.owner.fullName}
                    </p>
                  ))}
                </ResultGroup>
              )}
              {data!.mentors.length > 0 && (
                <ResultGroup icon={GraduationCap} label="Mentors">
                  {data!.mentors.map((mentor) => (
                    <ResultRow key={mentor.id} href={`/mentors/${mentor.id}`} onClick={() => setOpen(false)}>
                      {mentor.owner.fullName}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {data!.incubators.length > 0 && (
                <ResultGroup icon={Compass} label="Incubators">
                  {data!.incubators.map((incubator) => (
                    <ResultRow key={incubator.id} href={`/incubators/${incubator.id}`} onClick={() => setOpen(false)}>
                      {incubator.organizationName}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {data!.jobs.length > 0 && (
                <ResultGroup icon={Users} label="Jobs">
                  {data!.jobs.map((job) => (
                    <ResultRow key={job.id} href="/jobs" onClick={() => setOpen(false)}>
                      {job.title} · {job.startup.name}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              <button
                type="button"
                onClick={goToFullResults}
                className="mx-2 mt-1 rounded-button px-2 py-2 text-left text-xs font-semibold text-brand-primary hover:bg-background-secondary"
              >
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-text-secondary">No results for &ldquo;{debouncedQuery}&rdquo;.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ icon: Icon, label, children }: { icon: typeof Search; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-1">
      <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        <Icon className="h-3 w-3" /> {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="truncate rounded-button px-2 py-1.5 text-sm text-text-primary hover:bg-background-secondary"
    >
      {children}
    </Link>
  );
}
