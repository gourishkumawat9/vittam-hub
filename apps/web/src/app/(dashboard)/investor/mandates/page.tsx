"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateMandate, useMandateMatches, useMandates, useRemoveMandate, useUpdateMandate } from "@vittamhub/api-client";
import { createMandateInputSchema, Industry, RevenueStatus, StartupStage, type CreateMandateInput } from "@vittamhub/types";
import { Badge, Button, Card, Checkbox, Dialog, EmptyState, ErrorState, Input, TagsInput } from "@vittamhub/ui";
import { ChevronDown, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const INDUSTRY_OPTIONS = Object.values(Industry);
const STAGE_OPTIONS = Object.values(StartupStage);
const REVENUE_STATUS_OPTIONS = Object.values(RevenueStatus);

function CreateMandateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMandate = useCreateMandate();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMandateInput>({
    resolver: zodResolver(createMandateInputSchema),
    defaultValues: { industries: [], stages: [], geography: [], revenueStatuses: [], raisingOnly: false, requireVerified: false },
  });

  const industries = watch("industries") ?? [];
  const stages = watch("stages") ?? [];
  const revenueStatuses = watch("revenueStatuses") ?? [];

  const toggle = <T,>(list: T[], value: T, field: "industries" | "stages" | "revenueStatuses") => {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setValue(field, next as never);
  };

  const onSubmit = handleSubmit(async (data) => {
    await createMandate.mutateAsync(data);
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create investment mandate"
      description="A named, reusable thesis that produces its own match stream."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={createMandate.isPending}>
            Create mandate
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Name" placeholder="e.g. Seed FinTech India" error={errors.name?.message} {...register("name")} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-text-primary">Industries</p>
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-card border border-border p-2 sm:grid-cols-3">
            {INDUSTRY_OPTIONS.map((value) => (
              <Checkbox
                key={value}
                checked={industries.includes(value)}
                onCheckedChange={() => toggle(industries, value, "industries")}
                label={titleCase(value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-text-primary">Stages</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {STAGE_OPTIONS.map((value) => (
              <Checkbox key={value} checked={stages.includes(value)} onCheckedChange={() => toggle(stages, value, "stages")} label={titleCase(value)} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-text-primary">Revenue status</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {REVENUE_STATUS_OPTIONS.map((value) => (
              <Checkbox
                key={value}
                checked={revenueStatuses.includes(value)}
                onCheckedChange={() => toggle(revenueStatuses, value, "revenueStatuses")}
                label={titleCase(value)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Min cheque (₹)" type="number" {...register("chequeMinAmount")} />
          <Input label="Max cheque (₹)" type="number" {...register("chequeMaxAmount")} />
        </div>

        <Controller
          control={control}
          name="geography"
          render={({ field }) => <TagsInput label="Geography" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Bengaluru, Mumbai…" />}
        />

        <div className="flex flex-wrap gap-4">
          <Checkbox checked={watch("raisingOnly") ?? false} onCheckedChange={(v) => setValue("raisingOnly", v)} label="Only startups currently raising" />
          <Checkbox checked={watch("requireVerified") ?? false} onCheckedChange={(v) => setValue("requireVerified", v)} label="Only verified startups" />
        </div>
      </form>
    </Dialog>
  );
}

function MandateCard({ id, name, industries, stages, isActive }: { id: string; name: string; industries: string[]; stages: string[]; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const updateMandate = useUpdateMandate();
  const removeMandate = useRemoveMandate();
  const { data: matches, isLoading: matchesLoading } = useMandateMatches(id, 10);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {industries.slice(0, 3).map((i) => (
              <Badge key={i} variant="brand">
                {titleCase(i)}
              </Badge>
            ))}
            {stages.slice(0, 2).map((s) => (
              <Badge key={s} variant="neutral">
                {titleCase(s)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Paused"}</Badge>
          <button
            type="button"
            onClick={() => updateMandate.mutate({ id, input: { isActive: !isActive } })}
            className="text-xs text-brand-primary hover:underline"
          >
            {isActive ? "Pause" : "Resume"}
          </button>
          <button type="button" onClick={() => removeMandate.mutate(id)} className="text-text-secondary hover:text-danger-600" aria-label="Delete mandate">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
        {expanded ? "Hide" : "View"} match stream <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-border pt-3">
          {matchesLoading ? (
            <p className="text-xs text-text-secondary">Loading matches…</p>
          ) : matches && matches.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {matches.map((match) => (
                <li key={match.startupId} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary">{match.startup.name}</span>
                  <Badge variant="brand">{match.score}% match</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-secondary">No matches yet for this mandate.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function MandatesPage() {
  const { data: mandates, isLoading, isError } = useMandates();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Investment mandates</h1>
          <p className="mt-1 text-sm text-text-secondary">Named, reusable theses, each produces its own match stream.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create mandate
        </Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : mandates && mandates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {mandates.map((mandate) => (
            <MandateCard
              key={mandate.id}
              id={mandate.id}
              name={mandate.name}
              industries={mandate.industries}
              stages={mandate.stages}
              isActive={mandate.isActive}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No mandates yet"
          description='Create a thesis like "Seed FinTech India" to get a dedicated match stream.'
        />
      )}

      <CreateMandateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
