"use client";

import { useIncubators } from "@vittamhub/api-client";
import { Avatar, Card, Skeleton } from "@vittamhub/ui";
import { CalendarRange } from "@vittamhub/ui/icons";
import Link from "next/link";

import { PanelLink, PanelTitle } from "../PageHeader";

import { programmeStatus } from "./programmes";

/**
 * Incubator programmes taking applications right now, closing soonest first,
 * each linking to the incubator's page. Read from the incubator directory, so
 * it only ever shows real, listed programmes.
 */
export function OpenCallsCard({ title = "Open calls", emptyHint, limit = 3 }: { title?: string; emptyHint: string; limit?: number }) {
  const { data, isLoading } = useIncubators({ page: 1, pageSize: 50 });

  const calls = (data?.items ?? [])
    .flatMap((incubator) =>
      incubator.programs
        .filter((programme) => programmeStatus(programme).state === "open")
        .map((programme) => ({ incubator, programme, status: programmeStatus(programme) })),
    )
    .sort((a, b) => (a.programme.applicationCycleEnd ?? "9999").localeCompare(b.programme.applicationCycleEnd ?? "9999"))
    .slice(0, limit);

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={CalendarRange} title={title} right={<PanelLink href="/incubators">All incubators</PanelLink>} />
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : calls.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {calls.map(({ incubator, programme, status }) => (
            <li key={programme.id}>
              <Link href={`/incubators/${incubator.id}`} className="group flex items-center gap-3">
                <Avatar name={incubator.organizationName} src={incubator.logoUrl} size="sm" className="rounded-button" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="body-5 truncate text-text-primary group-hover:text-brand-primary">{programme.name}</span>
                  <span className="caption-5 truncate">
                    {incubator.organizationName} · {status.hint}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="caption-5">{emptyHint}</p>
      )}
    </Card>
  );
}
