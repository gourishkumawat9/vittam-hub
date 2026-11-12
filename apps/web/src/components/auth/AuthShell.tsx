import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { HeroFilm } from "@/components/marketing/hero/HeroFilm";
import { cn } from "@/lib/utils";

export interface AuthShellProps {
  children: ReactNode;
  /** `narrow` (default) is the single bordered card every auth step uses; `wide` drops the card chrome for content that needs the width itself, e.g. register's role picker. */
  variant?: "narrow" | "wide";
  cardClassName?: string;
}

const POINTS = [
  "Free to join for founders, investors, mentors, incubators and universities",
  "Verification is automated, with no manual review queue",
  "Founders reach investors through connect requests, never cold messages",
];

/**
 * One shared layout for every auth route (login, register, forgot/verify/reset
 * password): the form on its own, and on wide screens a light blue panel
 * beside it with the logo, the home hero's line and the home page's film.
 * The panel is pinned at the window's height and the film takes the room
 * left under the text, keeping its 4:3 shape (`cqw`/`cqh` are its box's
 * width and height), so it fits a laptop screen without scrolling. The role
 * picker needs more room, so its panel only appears from 1280px.
 */
export function AuthShell({ children, variant = "narrow", cardClassName }: AuthShellProps) {
  const wide = variant === "wide";
  return (
    <div className={cn("grid min-h-screen", wide ? "xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
      <aside
        className={cn(
          "sticky top-0 isolate hidden h-screen flex-col gap-8 self-start overflow-hidden border-r border-border bg-gradient-to-b from-brand-50 via-brand-50 to-brand-100 px-12 pb-8 pt-10 dark:from-background-secondary dark:via-background-secondary dark:to-brand-950",
          wide ? "xl:flex" : "lg:flex",
        )}
      >
        <div
          aria-hidden="true"
          className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_55%_at_30%_15%,black,transparent)]"
        />
        <Link href="/" className="w-fit" aria-label="VittamHub home">
          <Logo height={30} />
        </Link>
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-primary">
            Visibility for tomorrow&apos;s unicorns
          </p>
          <p className="font-heading text-3xl font-bold tracking-tight text-text-primary xl:text-4xl">The digital identity for every startup.</p>
          <ul className="flex flex-col gap-2.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-h-0 flex-1 items-end justify-center [container-type:size]">
          <HeroFilm className="w-[min(100cqw,calc(100cqh*4/3))]" />
        </div>
        <p className="text-sm text-text-secondary">© {new Date().getFullYear()} VittamHub</p>
      </aside>

      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link href="/" className={cn("mb-8", wide ? "xl:hidden" : "lg:hidden")} aria-label="VittamHub home">
          <Logo />
        </Link>
        <div className={cn("w-full", wide ? "max-w-4xl" : "max-w-sm")}>
          {wide ? children : <div className={cn("rounded-card border border-border bg-surface p-8 shadow-sm", cardClassName)}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
