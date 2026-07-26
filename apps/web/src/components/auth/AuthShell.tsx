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

/**
 * One shared layout for every auth route (login, register, forgot/verify/reset
 * password) — same logo placement, same ambient background, same spacing
 * rhythm, so the funnel reads as one continuous system instead of three.
 */
export function AuthShell({ children, variant = "narrow", cardClassName }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className={cn("w-full", variant === "wide" ? "max-w-4xl" : "max-w-sm")}>
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        {variant === "wide" ? children : <div className={cn("rounded-card border border-border bg-surface p-8 shadow-lg", cardClassName)}>{children}</div>}
      </div>
    </div>
  );
}
