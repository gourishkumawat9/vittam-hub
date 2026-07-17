"use client";

import { usePipeline, useUpdatePipelineEntry, type PipelineEntryWithStartup } from "@vittamhub/api-client";
import { PipelineStage } from "@vittamhub/types";
import { Card, EmptyState } from "@vittamhub/ui";
import { Kanban } from "lucide-react";
import { useState } from "react";

const STAGE_LABEL: Record<PipelineStage, string> = {
  TARGET: "Target",
  INTERESTED: "Interested",
  MEETING: "Meeting",
  DUE_DILIGENCE: "Due Diligence",
  NEGOTIATION: "Negotiation",
  INVESTED: "Invested",
  CLOSED: "Closed",
};

const STAGES = Object.values(PipelineStage);

function PipelineCard({ entry }: { entry: PipelineEntryWithStartup }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", entry.id)}
      className="cursor-grab rounded-card border border-border bg-surface p-3 shadow-sm active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-text-primary">{entry.startup.name}</p>
      <p className="text-xs text-text-secondary">{entry.startup.industry}</p>
    </div>
  );
}

export default function PipelinePage() {
  const { data: entries, isLoading } = usePipeline();
  const updateEntry = useUpdatePipelineEntry();
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDrop = (stage: PipelineStage) => (e: React.DragEvent) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData("text/plain");
    if (entryId) updateEntry.mutate({ id: entryId, input: { stage } });
    setDragOverStage(null);
  };

  if (!isLoading && (!entries || entries.length === 0)) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Investment Pipeline</h1>
        <EmptyState icon={Kanban} title="Your pipeline is empty" description="Add startups from Discover Startups to start tracking deals here." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Investment Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageEntries = (entries ?? []).filter((entry) => entry.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={handleDrop(stage)}
              className={`flex w-64 shrink-0 flex-col gap-3 rounded-card border p-3 ${
                dragOverStage === stage ? "border-brand-primary bg-brand-50" : "border-border bg-background-secondary"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{STAGE_LABEL[stage]}</h2>
                <span className="text-xs text-text-secondary">{stageEntries.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {stageEntries.map((entry) => (
                  <PipelineCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="text-xs text-text-secondary">Drag a card to a new stage to update it. Moving to Invested adds it to your Portfolio.</Card>
    </div>
  );
}
