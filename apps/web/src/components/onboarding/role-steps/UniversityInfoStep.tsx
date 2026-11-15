"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUniversityInputSchema, type CreateUniversityInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { usePublishProfile } from "@/hooks/usePublishProfile";

import { WizardNav } from "../WizardNav";

interface UniversityInfoStepProps {
  defaultValues?: Partial<CreateUniversityInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

export function UniversityInfoStep({ defaultValues, onBack, isEditing = false }: UniversityInfoStepProps) {
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();

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
  useAutosave("universityInfo", 1, values);

  const onSubmit = handleSubmit((data) =>
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ universityInfo: data }, { isEditing, redirectTo: (profile) => `/universities/${profile.id}` }),
  );

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

      {publishError && (
        <p role="alert" className="rounded-button border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {publishError}
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={isPublishing} nextLabel={isEditing ? "Save changes" : "Publish profile"} />
    </form>
  );
}
