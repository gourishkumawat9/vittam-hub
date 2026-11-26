"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { tractionStepSchema, type TractionStepInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { StepHeader } from "../fields";

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
  useAutosave("traction", 5, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("traction", data);
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <StepHeader optional title="Traction" description="Users, customers and revenue, once you have them. Investors filter by these, so it helps as soon as it applies." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Monthly revenue (₹)" type="number" {...register("monthlyRevenueAmount")} />
        <Input label="ARR (₹)" type="number" {...register("arrAmount")} />
        <Input label="MRR (₹)" type="number" {...register("mrrAmount")} />
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

      <WizardNav onBack={onBack} onNext={onSubmit} backLabel="Back to review" nextLabel="Save and review" />
    </form>
  );
}
