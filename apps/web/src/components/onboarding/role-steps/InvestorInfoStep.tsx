"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding } from "@vittamhub/api-client";
import { createInvestorInputSchema, InvestorType, StartupStage, type CreateInvestorInput } from "@vittamhub/types";
import { Checkbox, Input, Select, TagsInput, Textarea } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const INVESTOR_TYPE_OPTIONS = Object.values(InvestorType).map((value) => ({ label: titleCase(value), value }));
const STAGE_OPTIONS = Object.values(StartupStage);

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface InvestorInfoStepProps {
  defaultValues?: Partial<CreateInvestorInput>;
  onBack: () => void;
}

export function InvestorInfoStep({ defaultValues, onBack }: InvestorInfoStepProps) {
  const router = useRouter();
  const { setSectionData, reset } = useOnboardingStore();
  const publish = usePublishOnboarding();
  const [publishError, setPublishError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInvestorInput>({
    resolver: zodResolver(createInvestorInputSchema),
    defaultValues: { preferredIndustries: [], preferredStages: [], preferredGeography: [], portfolioCompanies: [], openForPitches: true, ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("investorInfo", 1, values);

  const togglePreferredStage = (stage: StartupStage) => {
    const current = values.preferredStages ?? [];
    setValue("preferredStages", current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage]);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("investorInfo", data);
    setPublishError(null);
    try {
      await publish.mutateAsync({});
      reset();
      router.push("/investor?published=true");
    } catch {
      setPublishError("We couldn't publish your profile. Please check your details and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Investor profile</h2>
        <p className="mt-1 text-sm text-text-secondary">How founders will find and evaluate you.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Firm name" hint="Leave blank if investing individually" {...register("firmName")} />
        <Input label="Designation" {...register("designation")} />
        <Controller
          control={control}
          name="investorType"
          render={({ field }) => (
            <Select label="Investor type" options={INVESTOR_TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.investorType?.message} />
          )}
        />
        <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
      </div>

      <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register("bio")} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Preferred stages</span>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => togglePreferredStage(stage)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                (values.preferredStages ?? []).includes(stage)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {titleCase(stage)}
            </button>
          ))}
        </div>
        {errors.preferredStages?.message && <p className="text-xs text-danger-600">{errors.preferredStages.message}</p>}
      </div>

      <Controller
        control={control}
        name="preferredIndustries"
        render={({ field }) => (
          <TagsInput label="Preferred industries" value={field.value ?? []} onChange={field.onChange} error={errors.preferredIndustries?.message} />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Check size min (USD)" type="number" error={errors.checkSizeMinUsd?.message} {...register("checkSizeMinUsd")} />
        <Input label="Check size max (USD)" type="number" error={errors.checkSizeMaxUsd?.message} {...register("checkSizeMaxUsd")} />
      </div>

      <Controller
        control={control}
        name="preferredGeography"
        render={({ field }) => <TagsInput label="Preferred geography" value={field.value ?? []} onChange={field.onChange} />}
      />

      <Input label="Location" error={errors.location?.message} {...register("location")} />

      <Controller
        control={control}
        name="portfolioCompanies"
        render={({ field }) => <TagsInput label="Portfolio companies" value={field.value ?? []} onChange={field.onChange} />}
      />

      <Textarea label="Investment thesis" rows={2} {...register("investmentThesis")} />

      <Controller
        control={control}
        name="openForPitches"
        render={({ field }) => (
          <Checkbox checked={field.value} onCheckedChange={field.onChange} label="I'm currently open to receiving pitches" />
        )}
      />

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
