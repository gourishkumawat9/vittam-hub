import { Skeleton } from "@vittamhub/ui";

/** Fallback for below-the-fold sections loaded via next/dynamic — mirrors typical section shape instead of a blank gap. */
export function SectionSkeleton({ className = "py-24" }: { className?: string }) {
  return (
    <div className={`mx-auto max-w-content px-6 ${className}`}>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-card" />
        ))}
      </div>
    </div>
  );
}
