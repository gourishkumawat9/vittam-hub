"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateMandate, useMandateMatches, useMandates, useRemoveMandate, useUpdateMandate } from "@vittamhub/api-client";
import { createMandateInputSchema, Industry, RevenueStatus, StartupStage, type CreateMandateInput, type InvestmentMandate } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, Checkbox, Dialog, EmptyState, ErrorState, Input, Skeleton, TagsInput } from "@vittamhub/ui";
import { Check, ChevronDown, Pause, Play, Plus, Target, Trash2 } from "@vittamhub/ui/icons";
import { formatCompactMoney } from "@vittamhub/utils";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { INDUSTRY_LABEL, REVENUE_STATUS_LABEL, STAGE_LABEL } from "@/lib/startup-options";
import { cn } from "@/lib/utils";

const INDUSTRY_OPTIONS = Object.values(Industry);
const STAGE_OPTIONS = Object.values(StartupStage);
const REVENUE_STATUS_OPTIONS = Object.values(RevenueStatus);

/** A row of on/off chips: lighter than a wall of checkboxes, and each one is a real toggle button. */
function ChipGroup<T extends string>({
  label,
  options,
  selected,
  labelOf,
  onToggle,
}: {
  label: string;
  options: T[];
  selected: T[];
  labelOf: (value: T) => string;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-text-primary">
        {label}
        <span className="ml-1.5 font-normal text-text-secondary">{selected.length > 0 ? `${selected.length} chosen` : "Any"}</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((value) => {
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on
                  ? "border-brand-primary bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                  : "border-border text-text-secondary hover:border-brand-200 hover:text-text-primary",
              )}
            >
              {on && <Check className="h-3 w-3" aria-hidden="true" />}
              {labelOf(value)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

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
      title="New mandate"
      description="Leave a group empty to accept any value. Every listed startup is scored against what you choose."
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
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Input label="Name" placeholder="e.g. Seed fintech, India" error={errors.name?.message} {...register("name")} />

        <ChipGroup label="Industries" options={INDUSTRY_OPTIONS} selected={industries} labelOf={(v) => INDUSTRY_LABEL[v] ?? v} onToggle={(v) => toggle(industries, v, "industries")} />
        <ChipGroup label="Stages" options={STAGE_OPTIONS} selected={stages} labelOf={(v) => STAGE_LABEL[v] ?? v} onToggle={(v) => toggle(stages, v, "stages")} />
        <ChipGroup
          label="Revenue"
          options={REVENUE_STATUS_OPTIONS}
          selected={revenueStatuses}
          labelOf={(v) => REVENUE_STATUS_LABEL[v] ?? v}
          onToggle={(v) => toggle(revenueStatuses, v, "revenueStatuses")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Smallest cheque (₹)" type="number" min={0} {...register("chequeMinAmount")} />
          <Input label="Largest cheque (₹)" type="number" min={0} {...register("chequeMaxAmount")} />
        </div>

        <Controller
          control={control}
          name="geography"
          render={({ field }) => <TagsInput label="Cities or regions" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Bengaluru, Mumbai…" />}
        />

        <div className="flex flex-col gap-2">
          <Checkbox checked={watch("raisingOnly") ?? false} onCheckedChange={(v) => setValue("raisingOnly", v)} label="Only startups that are raising now" />
          <Checkbox checked={watch("requireVerified") ?? false} onCheckedChange={(v) => setValue("requireVerified", v)} label="Only startups with the Verified badge" />
        </div>
      </form>
    </Dialog>
  );
}

/** The mandate's criteria as short chips, so the card reads as the thesis itself. */
function criteriaOf(mandate: InvestmentMandate) {
  const chips: string[] = [
    ...mandate.industries.map((v) => INDUSTRY_LABEL[v] ?? v),
    ...mandate.stages.map((v) => STAGE_LABEL[v] ?? v),
    ...mandate.revenueStatuses.map((v) => REVENUE_STATUS_LABEL[v] ?? v),
    ...mandate.geography,
  ];
  const min = mandate.chequeMinAmount;
  const max = mandate.chequeMaxAmount;
  if (min != null && max != null) chips.push(`${formatCompactMoney(min, mandate.currency)} to ${formatCompactMoney(max, mandate.currency)} cheques`);
  else if (min != null) chips.push(`Cheques from ${formatCompactMoney(min, mandate.currency)}`);
  else if (max != null) chips.push(`Cheques up to ${formatCompactMoney(max, mandate.currency)}`);
  if (mandate.raisingOnly) chips.push("Raising now");
  if (mandate.requireVerified) chips.push("Verified only");
  return chips;
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-success-500";
  if (score >= 50) return "bg-brand-primary";
  return "bg-brand-200";
}

function MandateCard({ mandate }: { mandate: InvestmentMandate }) {
  const [showAll, setShowAll] = useState(false);
  const updateMandate = useUpdateMandate();
  const removeMandate = useRemoveMandate();
  const { data: matches, isLoading } = useMandateMatches(mandate.id, 10);
  const criteria = criteriaOf(mandate);
  const shown = showAll ? (matches ?? []) : (matches ?? []).slice(0, 3);

  return (
    <Card className={cn("flex flex-col gap-5", !mandate.isActive && "opacity-80")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="title-2">{mandate.name}</h2>
            <Badge variant={mandate.isActive ? "success" : "neutral"}>{mandate.isActive ? "Active" : "Paused"}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {criteria.length > 0 ? (
              criteria.map((chip) => (
                <span key={chip} className="rounded-full bg-background-secondary px-2.5 py-0.5 text-xs text-text-secondary">
                  {chip}
                </span>
              ))
            ) : (
              <span className="caption-5">Any startup</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => updateMandate.mutate({ id: mandate.id, input: { isActive: !mandate.isActive } })} isLoading={updateMandate.isPending}>
            {mandate.isActive ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {mandate.isActive ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => removeMandate.mutate(mandate.id)} isLoading={removeMandate.isPending} aria-label={`Delete ${mandate.name}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="caption-4 uppercase tracking-wide">Best fits</p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : shown.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-button border border-border">
            {shown.map((match) => (
              <li key={match.startupId} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={match.startup.name} src={match.startup.logoUrl} size="sm" className="rounded-button" />
                  <div className="min-w-0">
                    <Link href={`/startups/${match.startup.slug}`} className="body-5 block truncate text-text-primary hover:text-brand-primary">
                      {match.startup.name}
                    </Link>
                    <p className="caption-5 truncate">
                      {[STAGE_LABEL[match.startup.stage] ?? match.startup.stage, INDUSTRY_LABEL[match.startup.industry] ?? match.startup.industry].join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:max-w-[45%] sm:justify-end">
                  {match.reasons
                    .filter((reason) => reason.matched)
                    .slice(0, 3)
                    .map((reason) => (
                      <span key={reason.key} className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] text-success-700">
                        <Check className="h-3 w-3" aria-hidden="true" /> {reason.label}
                      </span>
                    ))}
                </div>
                <div className="flex w-24 shrink-0 items-center gap-2" aria-label={`${match.score}% fit`}>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-secondary">
                    <span className={cn("block h-full rounded-full", scoreTone(match.score))} style={{ width: `${match.score}%` }} />
                  </span>
                  <span className="font-numeric text-sm font-semibold text-text-primary">{match.score}%</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="caption-5 rounded-button bg-background-secondary px-3 py-3">No listed startup fits this mandate yet. As founders publish profiles, fits show up here.</p>
        )}
        {(matches?.length ?? 0) > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 self-start text-sm font-medium text-brand-primary hover:underline"
            aria-expanded={showAll}
          >
            {showAll ? "Show the top three" : `Show all ${matches!.length}`}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  );
}

export default function MandatesPage() {
  const { data: mandates, isLoading, isError } = useMandates();
  const [createOpen, setCreateOpen] = useState(false);
  const activeCount = (mandates ?? []).filter((m) => m.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mandates"
        description="Each mandate is a thesis you invest against, such as seed fintech in India. Every listed startup is scored against it, and the best fits show under it."
        meta={mandates && mandates.length > 0 ? <Badge variant="neutral">{activeCount} active</Badge> : undefined}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New mandate
          </Button>
        }
      />

      {isLoading ? (
        <CardGridSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : mandates && mandates.length > 0 ? (
        <div className="flex flex-col gap-6">
          {mandates.map((mandate) => (
            <MandateCard key={mandate.id} mandate={mandate} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No mandates yet"
          description="Write down a thesis, such as seed fintech in India with ₹25 lakh to ₹1 crore cheques, and see which startups fit it best."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New mandate
            </Button>
          }
        />
      )}

      <CreateMandateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
