"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUniversityInputSchema, type CreateUniversityInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { AvatarUpload } from "@/components/AvatarUpload";
import { useAutosave } from "@/hooks/useAutosave";
import { usePublishProfile } from "@/hooks/usePublishProfile";
import { INSTITUTION_TYPE_LABEL } from "@/lib/signup-options";
import { optionsFrom } from "@/lib/startup-options";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const INSTITUTION_OPTIONS = optionsFrom(INSTITUTION_TYPE_LABEL);

interface UniversityInfoStepProps {
  defaultValues?: Partial<CreateUniversityInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

/**
 * A university's or institution's page: the institution, its type (the
 * categories AISHE and BHASKAR use), your role there and where it is. Then the
 * logo, website and the E-cell or incubation cell students should know about.
 * The AISHE code is self-declared until it can be checked automatically.
 */
export function UniversityInfoStep({ defaultValues, onBack, isEditing = false }: UniversityInfoStepProps) {
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();
  const draft = useOnboardingStore((s) => s.draft);
  const personal = draftSection<{ city?: string; state?: string }>(draft, "personalDetails");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUniversityInput>({
    resolver: zodResolver(createUniversityInputSchema),
    defaultValues: { departments: [], programsOffered: [], city: personal?.city, state: personal?.state, ...defaultValues },
  });

  const values = watch();
  useAutosave("universityInfo", 1, values);

  const onSubmit = handleSubmit((data) =>
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ universityInfo: data }, { isEditing, redirectTo: (profile) => `/universities/${profile.id}` }),
  );

  const moreFilled = hasAny([values.aisheCode, values.departments, values.programsOffered]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title="Your institution"
        minutes={2}
        description="Student founders find you by name and city, then look for your E-cell and programmes."
      />

      <FieldSection title="The institution">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Institution name" required autoComplete="organization" error={errors.institutionName?.message} {...register("institutionName")} />
          <Input
            label="Your role there"
            required
            autoComplete="organization-title"
            placeholder="E-cell faculty coordinator"
            error={errors.designation?.message}
            {...register("designation")}
          />
        </div>
        <Controller
          control={control}
          name="affiliationType"
          render={({ field }) => (
            <ChoiceChips label="Type of institution" required options={INSTITUTION_OPTIONS} value={field.value} onChange={field.onChange} error={errors.affiliationType?.message} />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
          <Input label="State" autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
        </div>
      </FieldSection>

      <FieldSection title="Your page" description="What students and founders see when they open it.">
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => <AvatarUpload kind="logo" value={field.value} onChange={field.onChange} />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Website" placeholder="https://…" autoComplete="url" error={errors.website?.message} {...register("website")} />
          <Input label="E-cell or incubation cell" placeholder="E-Cell IIT Bombay" error={errors.incubationCellName?.message} {...register("incubationCellName")} />
        </div>
      </FieldSection>

      <MoreDetails title="More about the institution" description="Optional. Add these now or any time." defaultOpen={moreFilled}>
        <Input
          label="AISHE code"
          placeholder="U-0123"
          autoCapitalize="characters"
          hint="From the All India Survey on Higher Education. Self-declared."
          error={errors.aisheCode?.message}
          {...register("aisheCode")}
        />
        <Controller
          control={control}
          name="departments"
          render={({ field }) => <TagsInput label="Departments" value={field.value ?? []} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="programsOffered"
          render={({ field }) => <TagsInput label="Programmes for founders" hint="For example a startup elective or a pre-incubation programme" value={field.value ?? []} onChange={field.onChange} />}
        />
      </MoreDetails>

      {publishError && (
        <p role="alert" className="rounded-button border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {publishError}
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={isPublishing} nextLabel={isEditing ? "Save changes" : "Publish profile"} />
    </form>
  );
}
