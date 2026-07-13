import { Badge } from "@vittamhub/ui";
import { ArrowRight, MapPin, Users } from "lucide-react";
import Link from "next/link";

import type { StartupCard } from "@/data/startups";
import { FEATURED_STARTUPS } from "@/data/startups";

import { SectionHeading } from "./SectionHeading";

const LOOPED_STARTUPS = [...FEATURED_STARTUPS, ...FEATURED_STARTUPS];

const STAGE_BADGE_VARIANT: Record<StartupCard["stage"], "neutral" | "brand" | "success" | "warning"> = {
  Idea: "neutral",
  MVP: "brand",
  Revenue: "warning",
  Funded: "success",
  Scaling: "success",
};

function StartupTile({ startup }: { startup: StartupCard }) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-card border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-bold text-brand-700">
            {startup.initials}
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-text-primary">{startup.name}</h3>
            <p className="text-xs text-text-secondary">{startup.industry}</p>
          </div>
        </div>
        <Badge variant={STAGE_BADGE_VARIANT[startup.stage]}>{startup.stage}</Badge>
      </div>

      <p className="mt-4 flex-1 text-sm text-text-secondary">{startup.tagline}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {startup.location}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {startup.followers.toLocaleString()}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-medium text-text-secondary">
          Trust score <span className="font-numeric font-bold text-text-primary">{startup.trustScore}</span>
        </span>
        <Link href="/login" className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
          View profile
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export function DiscoverStartups() {
  return (
    <section id="discover-startups" className="border-t border-border py-24">
      <div className="mx-auto max-w-content px-6">
        <SectionHeading
          eyebrow="Discover"
          title="Startups across every stage, in one place"
          description="Illustrative example profiles — VittamHub is in early access and these are not real companies."
          action={<Badge variant="neutral">Example profiles</Badge>}
        />
      </div>

      <div className="pause-on-hover relative mt-16 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="animate-marquee-slow flex w-max gap-5">
          {LOOPED_STARTUPS.map((startup, index) => (
            <StartupTile key={`${startup.id}-${index}`} startup={startup} />
          ))}
        </div>
      </div>
    </section>
  );
}
