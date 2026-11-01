import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export interface StatusScreenProps {
  title: string;
  description?: ReactNode;
  /** Large text above the title, e.g. "404". */
  eyebrow?: string;
  /** Buttons/links, or a progress bar while something loads. */
  children?: ReactNode;
  /** Shown above the title in place of the logo, e.g. the animated `CinematicLoader` while something loads. */
  illustration?: ReactNode;
  className?: string;
}

/**
 * The one full-page VittamHub screen for anything that isn't a normal page:
 * loading, waking the API, outages, crashes and 404s. Keeping them on one
 * component means every one of those moments looks like the same product.
 */
export function StatusScreen({ title, description, eyebrow, children, illustration, className }: StatusScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center",
        className,
      )}
    >
      {illustration ?? <Logo height={36} />}
      <div className="flex max-w-md flex-col items-center gap-3">
        {eyebrow && <p className="font-numeric text-6xl font-bold text-brand-primary">{eyebrow}</p>}
        <h1 className="font-heading text-2xl font-semibold text-text-primary">{title}</h1>
        {description && <p className="text-text-secondary">{description}</p>}
      </div>
      {children && <div className="flex w-full max-w-sm flex-col items-center gap-3">{children}</div>}
    </div>
  );
}
