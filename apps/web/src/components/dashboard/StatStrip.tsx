import Link from "next/link";

import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
  /** A short line under the number, e.g. "2 need a reply". */
  hint?: string;
  href?: string;
}

/**
 * Key numbers in one panel instead of a row of separate boxes. Dividers come
 * from a 1px gap over the border colour, so no cell needs a one-sided border.
 */
export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border",
        stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
        className,
      )}
    >
      {stats.map((stat) => {
        const body = (
          <>
            <dt className="caption-4">{stat.label}</dt>
            <dd className="font-numeric text-2xl font-semibold text-text-primary">{stat.value}</dd>
            {stat.hint && <dd className="caption-5">{stat.hint}</dd>}
          </>
        );
        return stat.href ? (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-1 bg-surface p-4 transition-colors duration-300 ease-base hover:bg-brand-50 focus-visible:relative dark:hover:bg-white/5 sm:p-6"
          >
            {body}
          </Link>
        ) : (
          <div key={stat.label} className="flex flex-col gap-1 bg-surface p-4 sm:p-6">
            {body}
          </div>
        );
      })}
    </dl>
  );
}
