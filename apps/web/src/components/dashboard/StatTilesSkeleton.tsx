import { Card, Skeleton } from "@vittamhub/ui";

/** Mirrors a row of DashboardCard stat tiles (icon + label + big number). */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-12" />
        </Card>
      ))}
    </div>
  );
}
