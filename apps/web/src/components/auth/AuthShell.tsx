import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
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
 * password): the form on white, and on wide screens a navy panel beside it
 * with the logo and what VittamHub is, matching the website's navy bands.
 * The role picker needs more room, so its panel only appears from 1280px.
 */
export function AuthShell({ children, variant = "narrow", cardClassName }: AuthShellProps) {
  const wide = variant === "wide";
  return (
    <div className={cn("grid min-h-screen", wide ? "xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
      <aside className={cn("theme-navy relative hidden flex-col justify-between overflow-hidden p-12", wide ? "xl:flex" : "lg:flex")}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_100%,rgb(46_111_209/0.35),transparent_70%)]"
        />
        <Link href="/" className="relative w-fit" aria-label="VittamHub home">
          <Logo height={30} />
        </Link>
        <div className="relative flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Visibility for tomorrow&apos;s unicorns</p>
          <p className="font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary xl:text-4xl">
            The digital identity for every startup.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-text-secondary">© {new Date().getFullYear()} VittamHub</p>
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
