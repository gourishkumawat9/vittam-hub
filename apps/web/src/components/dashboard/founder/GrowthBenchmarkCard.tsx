"use client";

import type { GrowthBenchmark } from "@vittamhub/api-client";
import { Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { TrendingUp } from "lucide-react";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Computed live from real peer traction data — never a canned number. See BenchmarkService for the minimum-sample-size honesty rule. */
export function GrowthBenchmarkCard({ benchmark }: { benchmark: GrowthBenchmark }) {
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-brand-primary" /> Growth benchmark
        </CardTitle>
      </CardHeader>

      {benchmark.percentile != null ? (
        <p className="text-sm text-text-primary">
          Your growth is in the top <span className="font-semibold">{100 - benchmark.percentile}%</span> of {titleCase(benchmark.stage)}-stage{" "}
          {titleCase(benchmark.industry)} startups on VittamHub, based on {benchmark.sampleSize} comparable peers.
        </p>
      ) : (
        <p className="text-sm text-text-secondary">{benchmark.reason ?? "Not enough data yet to benchmark your growth."}</p>
      )}
    </Card>
  );
}
