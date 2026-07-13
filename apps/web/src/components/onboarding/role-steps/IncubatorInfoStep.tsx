"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding } from "@vittamhub/api-client";
import { createIncubatorInputSchema, type CreateIncubatorInput } from "@vittamhub/types";
import { Input, TagsInput, Textarea } from "@vittamhub/ui";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

interface IncubatorInfoStepProps {
  defaultValues?: Partial<CreateIncubatorInput>;
  onBack: () => void;
}

export function IncubatorInfoStep({ defaultValues, onBack }: IncubatorInfoStepProps) {
  const router = useRouter();
  const { setSectionData, reset } = useOnboardingStore();
  const publish = usePublishOnboarding();
  const [publishError, setPublishError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateIncubatorInput>({
    resolver: zodResolver(createIncubatorInputSchema),
    defaultValues: { industries: [], portfolioCompanies: [], programs: [], ...defaultValues },
  });

  const programs = useFieldArray({ control, name: "programs" });
  const values = watch();
  const { status } = useAutosave("incubatorInfo", 1, values);

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("incubatorInfo", data);
    setPublishError(null);
    try {
      await publish.mutateAsync({});
      reset();
      router.push("/?published=true");
    } catch {
      setPublishError("We couldn't publish your profile. Please check your details and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Incubator / accelerator profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Let startups discover your programs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Organization name" error={errors.organizationName?.message} {...register("organizationName")} />
        <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
      </div>

      <Textarea label="Description" rows={3} {...register("description")} />

      <Controller
        control={control}
        name="industries"
        render={({ field }) => (
          <TagsInput label="Industries" value={field.value ?? []} onChange={field.onChange} error={errors.industries?.message} />
        )}
      />
      <Controller
        control={control}
        name="portfolioCompanies"
        render={({ field }) => <TagsInput label="Portfolio companies" value={field.value ?? []} onChange={field.onChange} />}
      />

      <Input label="Affiliated mentor count" type="number" {...register("affiliatedMentorCount")} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Programs</span>
          <button
            type="button"
            onClick={() => programs.append({ name: "" })}
            className="flex items-center gap-1 text-sm font-medium text-brand-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add program
          </button>
        </div>
        {programs.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 rounded-card border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input placeholder="Program name" {...register(`programs.${index}.name`)} />
                <Input placeholder="Duration (weeks)" type="number" {...register(`programs.${index}.durationWeeks`)} />
                <Input placeholder="Application cycle start" type="date" {...register(`programs.${index}.applicationCycleStart`)} />
                <Input placeholder="Application cycle end" type="date" {...register(`programs.${index}.applicationCycleEnd`)} />
              </div>
              <button type="button" onClick={() => programs.remove(index)} aria-label="Remove program" className="mt-2 text-text-secondary hover:text-danger-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Textarea placeholder="Program description" rows={2} {...register(`programs.${index}.description`)} />
          </div>
        ))}
      </div>

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
