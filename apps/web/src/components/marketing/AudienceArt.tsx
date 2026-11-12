import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Where the blue light sits on each panel, so a row of cards doesn't repeat itself. */
const LIGHT = ["at 15% 20%", "at 85% 25%", "at 50% 110%", "at 10% 90%", "at 90% 85%", "at 60% 0%"];

/**
 * The picture panel on top of an audience card. BCG uses photography; we
 * have no real photos of members and won't use stock people (CLAUDE.md §2),
 * so it's an abstract navy panel with rings and the audience's icon.
 */
export function AudienceArt({ icon: Icon, variant = 0, className }: { icon: LucideIcon; variant?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("theme-navy relative overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `radial-gradient(circle ${LIGHT[variant % LIGHT.length]}, rgb(46 111 209 / 0.5), transparent 62%)` }}
      />
      <div className="absolute -right-24 top-1/2 aspect-square h-[260%] -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute -right-10 top-1/2 aspect-square h-[180%] -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute right-6 top-1/2 aspect-square h-[105%] -translate-y-1/2 rounded-full border border-white/15" />
      <div className="relative flex h-full items-end p-6 lg:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
          <Icon className="h-7 w-7 text-brand-primary" />
        </span>
      </div>
    </div>
  );
}
