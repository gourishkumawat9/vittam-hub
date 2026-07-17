"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMyInvestorProfile, useUpdateMyInvestorProfile } from "@vittamhub/api-client";
import { InvestorType, StartupStage, updateInvestorInputSchema, type UpdateInvestorInput } from "@vittamhub/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, TagsInput, Textarea } from "@vittamhub/ui";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const INVESTOR_TYPE_OPTIONS = Object.values(InvestorType).map((value) => ({ label: titleCase(value), value }));
const STAGE_OPTIONS = Object.values(StartupStage);

export default function InvestorProfilePage() {
  const { data: investor, isLoading } = useMyInvestorProfile();
  const updateProfile = useUpdateMyInvestorProfile();
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateInvestorInput>({ resolver: zodResolver(updateInvestorInputSchema) });

  useEffect(() => {
    if (investor) {
      reset({
        firmName: investor.firmName ?? undefined,
        designation: investor.designation ?? undefined,
        investorType: investor.investorType,
        website: investor.website ?? undefined,
        bio: investor.bio,
        preferredIndustries: investor.preferredIndustries,
        preferredStages: investor.preferredStages,
        checkSizeMinUsd: investor.checkSizeMinUsd,
        checkSizeMaxUsd: investor.checkSizeMaxUsd,
        preferredGeography: investor.preferredGeography,
        location: investor.location,
        portfolioCompanies: investor.portfolioCompanies,
        investmentThesis: investor.investmentThesis ?? undefined,
        openForPitches: investor.openForPitches,
      });
    }
  }, [investor, reset]);

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    setSaved(false);
    await updateProfile.mutateAsync(data);
    setSaved(true);
  });

  const toggleStage = (stage: (typeof STAGE_OPTIONS)[number]) => {
    const current = values.preferredStages ?? [];
    setValue("preferredStages", current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage]);
  };

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Investor Profile</h1>

      {investor?.metrics && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">How founders see you</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 pt-3 text-sm text-text-secondary">
            <span>
              Response rate: <span className="font-medium text-text-primary">{investor.metrics.responseRate != null ? `${Math.round(investor.metrics.responseRate * 100)}%` : "No data yet"}</span>
            </span>
            <span>
              Avg. response time:{" "}
              <span className="font-medium text-text-primary">
                {investor.metrics.avgResponseTimeHours != null ? `${Math.round(investor.metrics.avgResponseTimeHours)}h` : "No data yet"}
              </span>
            </span>
            {investor.metrics.isActive && <Badge variant="success">Recently active</Badge>}
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Firm name" {...register("firmName")} />
          <Input label="Designation" {...register("designation")} />
          <Controller
            control={control}
            name="investorType"
            render={({ field }) => (
              <Select label="Investor type" options={INVESTOR_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />
            )}
          />
          <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
        </div>

        <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register("bio")} />
        <Textarea label="Investment thesis" rows={3} {...register("investmentThesis")} />

        <Controller
          control={control}
          name="preferredIndustries"
          render={({ field }) => <TagsInput label="Preferred industries" value={field.value ?? []} onChange={field.onChange} />}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">Preferred stages</span>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => toggleStage(stage)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  (values.preferredStages ?? []).includes(stage)
                    ? "border-brand-primary bg-brand-100 text-brand-700"
                    : "border-border text-text-secondary hover:bg-background-secondary"
                }`}
              >
                {titleCase(stage)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Check size min (USD)" type="number" {...register("checkSizeMinUsd")} />
          <Input label="Check size max (USD)" type="number" {...register("checkSizeMaxUsd")} />
        </div>

        <Controller
          control={control}
          name="preferredGeography"
          render={({ field }) => <TagsInput label="Preferred geography" value={field.value ?? []} onChange={field.onChange} />}
        />

        <Input label="Location" {...register("location")} />

        <Controller
          control={control}
          name="portfolioCompanies"
          render={({ field }) => <TagsInput label="Portfolio companies" value={field.value ?? []} onChange={field.onChange} />}
        />

        {saved && <p className="text-sm text-success-600">Profile updated.</p>}

        <Button type="submit" isLoading={updateProfile.isPending} className="self-start">
          Save changes
        </Button>
      </form>
    </div>
  );
}
