import { cn } from "../../lib/cn";

/**
 * Shimmering placeholder block. Compose these into shapes that mirror the
 * real content (e.g. a startup card skeleton = Skeleton avatar + two text
 * lines) rather than a single generic spinner — per the UX spec, every
 * loading state should look like what's about to appear.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200/70 dark:bg-neutral-800/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
