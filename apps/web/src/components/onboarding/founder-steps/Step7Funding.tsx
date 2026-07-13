"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FundingType, fundingStepSchema, type FundingStepInput } from "@vittamhub/types";
import { Input, TagsInput, Textarea } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const FUNDING_TYPE_OPTIONS = Object.values(FundingType);

interface StepProps {
  defaultValues?: Partial<FundingStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step7Funding({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const { register, handleSubmit, control, watch, setValue } = useForm<FundingStepInput>({
    resolver: zodResolver(fundingStepSchema),
    defaultValues: { fundingTypes: [], previousInvestors: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("funding", 6, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("funding", data);
    onNext();
  });

  const toggleFundingType = (type: FundingType) => {
    const current = values.fundingTypes ?? [];
    setValue("fundingTypes", current.includes(type) ? current.filter((t) => t !== type) : [...current, type]);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Funding</h2>
        <p className="mt-1 text-sm text-text-secondary">Your funding history and current raise, if any.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Funding types</span>
        <div className="flex flex-wrap gap-2">
          {FUNDING_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleFundingType(type)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                (values.fundingTypes ?? []).includes(type)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {type.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Current raise (USD)" type="number" {...register("currentRaiseUsd")} />
        <Input label="Funding goal (USD)" type="number" {...register("fundingGoalUsd")} />
        <Input label="Valuation (USD)" type="number" {...register("valuationUsd")} />
      </div>

      <Controller
        control={control}
        name="previousInvestors"
        render={({ field }) => <TagsInput label="Previous investors" value={field.value ?? []} onChange={field.onChange} />}
      />

      <Textarea label="Use of funds" rows={2} {...register("useOfFunds")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Runway (months)" type="number" {...register("runwayMonths")} />
        <Input label="Monthly burn rate (USD)" type="number" {...register("monthlyBurnRateUsd")} />
      </div>

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
