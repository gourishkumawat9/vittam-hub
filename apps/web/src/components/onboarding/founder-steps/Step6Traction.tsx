"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { tractionStepSchema, type TractionStepInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

interface StepProps {
  defaultValues?: Partial<TractionStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step6Traction({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const { register, handleSubmit, control, watch } = useForm<TractionStepInput>({
    resolver: zodResolver(tractionStepSchema),
    defaultValues: { partnerships: [], awards: [], patents: [], mediaMentions: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("traction", 5, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("traction", data);
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Traction</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Optional if you&apos;re pre-revenue — investors filter by stage, so this only helps once it applies.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Monthly revenue (USD)" type="number" {...register("monthlyRevenueUsd")} />
        <Input label="ARR (USD)" type="number" {...register("arrUsd")} />
        <Input label="MRR (USD)" type="number" {...register("mrrUsd")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Total users" type="number" {...register("totalUsers")} />
        <Input label="Total customers" type="number" {...register("totalCustomers")} />
        <Input label="Downloads" type="number" {...register("downloads")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Retention rate (%)" type="number" {...register("retentionRatePercent")} />
        <Input label="Growth rate (%)" type="number" {...register("growthRatePercent")} />
      </div>

      <Controller
        control={control}
        name="partnerships"
        render={({ field }) => <TagsInput label="Partnerships" value={field.value ?? []} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="awards"
        render={({ field }) => <TagsInput label="Awards" value={field.value ?? []} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="patents"
        render={({ field }) => <TagsInput label="Patents" value={field.value ?? []} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="mediaMentions"
        render={({ field }) => <TagsInput label="Media mentions" value={field.value ?? []} onChange={field.onChange} />}
      />

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
