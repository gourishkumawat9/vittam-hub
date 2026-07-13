"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding } from "@vittamhub/api-client";
import { createUniversityInputSchema, type CreateUniversityInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

interface UniversityInfoStepProps {
  defaultValues?: Partial<CreateUniversityInput>;
  onBack: () => void;
}

export function UniversityInfoStep({ defaultValues, onBack }: UniversityInfoStepProps) {
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
  } = useForm<CreateUniversityInput>({
    resolver: zodResolver(createUniversityInputSchema),
    defaultValues: { departments: [], programsOffered: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("universityInfo", 1, values);

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("universityInfo", data);
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
        <h2 className="font-heading text-xl font-semibold text-text-primary">Institution profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Showcase your incubation cell and programs to founders.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Institution name" error={errors.institutionName?.message} {...register("institutionName")} />
        <Input label="Affiliation type" hint='e.g. "Central University", "Private"' error={errors.affiliationType?.message} {...register("affiliationType")} />
        <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
        <Input label="Incubation cell name" {...register("incubationCellName")} />
      </div>

      <Controller
        control={control}
        name="departments"
        render={({ field }) => <TagsInput label="Departments" value={field.value ?? []} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="programsOffered"
        render={({ field }) => <TagsInput label="Programs offered" value={field.value ?? []} onChange={field.onChange} />}
      />

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
