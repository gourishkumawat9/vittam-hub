"use client";

import { usePipeline, useUpdatePipelineEntry, type PipelineEntryWithStartup } from "@vittamhub/api-client";
import { PipelineStage } from "@vittamhub/types";
import { Badge, Button, Skeleton } from "@vittamhub/ui";
import { Compass, GripVertical, Kanban } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { STAGE_LABEL as STARTUP_STAGE_LABEL } from "@/components/dashboard/founder/startup-labels";
import { cn } from "@/lib/utils";

const STAGE_LABEL: Record<PipelineStage, string> = {
  SOURCED: "Sourced",
  SCREENING: "Screening",
  DUE_DILIGENCE: "Due diligence",
  INVESTMENT_COMMITTEE: "Investment committee",
  TERM_SHEET: "Term sheet",
  CLOSED: "Closed",
  PASSED: "Passed",
};

/** One line under each column name, so a new investor knows what belongs there. */
const STAGE_HINT: Record<PipelineStage, string> = {
  SOURCED: "Saved to look at",
  SCREENING: "First calls and a read of the deck",
  DUE_DILIGENCE: "Documents, references, numbers",
  INVESTMENT_COMMITTEE: "Up for a decision",
  TERM_SHEET: "Terms on the table",
  CLOSED: "Invested, moves to Portfolio",
  PASSED: "Not for now",
};

const STAGES = Object.values(PipelineStage);

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * One startup on the board. It can be dragged to another column, or moved
 * with the "Move to" list, which works with a keyboard and on touch screens.
 */
function PipelineCard({ entry, onMove, moving }: { entry: PipelineEntryWithStartup; onMove: (stage: PipelineStage) => void; moving: boolean }) {
  const { startup } = entry;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", entry.id)}
      className={cn(
        "group flex cursor-grab flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        moving && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary opacity-40 group-hover:opacity-100" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link href={`/startups/${startup.slug}`} className="truncate body-5 text-text-primary hover:text-brand-primary hover:underline">
            {startup.name}
          </Link>
          <p className="caption-5 line-clamp-2">{startup.tagline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="brand">{STARTUP_STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
        <Badge variant="neutral">{titleCase(startup.industry)}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="caption-5">Moved {formatRelativeTime(entry.updatedAt)}</span>
        <label className="sr-only" htmlFor={`move-${entry.id}`}>
          Move {startup.name} to
        </label>
        <select
          id={`move-${entry.id}`}
          value={entry.stage}
          disabled={moving}
          onChange={(event) => onMove(event.target.value as PipelineStage)}
          className="max-w-[9rem] cursor-pointer rounded-button border border-border bg-surface px-2 py-1 caption-4 text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABEL[stage]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * The deal board: every startup the investor is tracking, by stage. The
 * columns always show, so the board reads as a board even before the first
 * startup is added.
 */
export default function PipelinePage() {
  const { data: entries, isLoading } = usePipeline();
  const updateEntry = useUpdatePipelineEntry();
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const move = (id: string, stage: PipelineStage) => updateEntry.mutate({ id, input: { stage } });

  const handleDrop = (stage: PipelineStage) => (e: React.DragEvent) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData("text/plain");
    if (entryId) move(entryId, stage);
    setDragOverStage(null);
  };

  const all = entries ?? [];
  const active = all.filter((entry) => entry.stage !== "CLOSED" && entry.stage !== "PASSED").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pipeline"
        description="Every startup you're tracking, by stage. Drag a card or use its Move to list. Moving one to Closed adds it to your portfolio."
        meta={!isLoading && all.length > 0 && <Badge variant="neutral">{active === 1 ? "1 active deal" : `${active} active deals`}</Badge>}
        actions={
          <Button size="sm" asChild>
            <Link href="/investor/discover">
              <Compass className="h-4 w-4" aria-hidden="true" /> Find startups
            </Link>
          </Button>
        }
      />

      {!isLoading && all.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Kanban className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
            <div>
              <p className="body-5 text-text-primary">Your board is empty</p>
              <p className="caption-5">Add a startup from Discover or from a connect request, and it starts in Sourced.</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/investor/discover">Discover startups</Link>
          </Button>
        </div>
      )}

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage) => {
          const stageEntries = all.filter((entry) => entry.stage === stage);
          return (
            <section
              key={stage}
              aria-label={STAGE_LABEL[stage]}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={handleDrop(stage)}
              className={cn(
                "flex w-64 shrink-0 flex-col gap-3 rounded-card border p-3 transition-colors",
                dragOverStage === stage ? "border-brand-primary bg-brand-50 dark:bg-brand-950" : "border-border bg-background-secondary",
              )}
            >
              <header className="flex flex-col gap-0.5 px-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="title-5">{STAGE_LABEL[stage]}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 font-numeric caption-4">{stageEntries.length}</span>
                </div>
                <p className="caption-5">{STAGE_HINT[stage]}</p>
              </header>

              {isLoading ? (
                <Skeleton className="h-24 w-full rounded-card" />
              ) : stageEntries.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {stageEntries.map((entry) => (
                    <PipelineCard
                      key={entry.id}
                      entry={entry}
                      onMove={(next) => move(entry.id, next)}
                      moving={updateEntry.isPending && updateEntry.variables?.id === entry.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-card border border-dashed border-border caption-5">Drop a card here</div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
