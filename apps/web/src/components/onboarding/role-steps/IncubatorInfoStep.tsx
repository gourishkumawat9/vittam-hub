"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createIncubatorInputSchema,
  GOVERNMENT_INCUBATOR_PROGRAMS,
  Industry,
  type CreateIncubatorInput,
  type GovernmentIncubatorProgram,
  type IncubatorHostType,
  type IncubatorKind,
} from "@vittamhub/types";
import { Input, TagsInput, Textarea } from "@vittamhub/ui";
import { Plus, Trash2 } from "@vittamhub/ui/icons";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { AvatarUpload } from "@/components/AvatarUpload";
import { useAutosave } from "@/hooks/useAutosave";
import { usePublishProfile } from "@/hooks/usePublishProfile";
import { GOVERNMENT_PROGRAM_LABEL, hintedOptions, INCUBATOR_HOST_HINT, INCUBATOR_HOST_LABEL, INCUBATOR_KIND_LABEL } from "@/lib/signup-options";
import { INDUSTRY_LABEL, optionsFrom } from "@/lib/startup-options";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const KIND_OPTIONS = optionsFrom<IncubatorKind>(INCUBATOR_KIND_LABEL);
const HOST_OPTIONS = hintedOptions<IncubatorHostType>(INCUBATOR_HOST_LABEL, INCUBATOR_HOST_HINT);
const SECTOR_OPTIONS = optionsFrom(INDUSTRY_LABEL);
const SECTOR_VALUES = new Set<string>(Object.values(Industry));
const SCHEME_OPTIONS = GOVERNMENT_INCUBATOR_PROGRAMS.map((value) => ({ value, label: GOVERNMENT_PROGRAM_LABEL[value] ?? value }));

interface IncubatorInfoStepProps {
  defaultValues?: Partial<CreateIncubatorInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
}

/**
 * An incubator's or accelerator's page, in the order BHASKAR asks: what it is
 * and who runs it, your role there, where it is and the sectors it backs. Then
 * what makes the page worth opening: logo, description, how many startups it
 * has incubated, the government schemes it runs under and the programmes
 * founders can apply to. Counts and schemes are self-declared.
 */
export function IncubatorInfoStep({ defaultValues, onBack, isEditing = false }: IncubatorInfoStepProps) {
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();
  const draft = useOnboardingStore((s) => s.draft);
  const personal = draftSection<{ city?: string; state?: string }>(draft, "personalDetails");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateIncubatorInput>({
    resolver: zodResolver(createIncubatorInputSchema),
    defaultValues: {
      industries: [],
      portfolioCompanies: [],
      programs: [],
      governmentPrograms: [],
      kind: "INCUBATOR",
      city: personal?.city,
      state: personal?.state,
      ...defaultValues,
    },
  });

  const programs = useFieldArray({ control, name: "programs" });
  const values = watch();
  useAutosave("incubatorInfo", 1, values);

  const onSubmit = handleSubmit((data) =>
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ incubatorInfo: data }, { isEditing, redirectTo: (profile) => `/incubators/${profile.id}` }),
  );

  const isAccelerator = values.kind === "ACCELERATOR";
  const customSectors = (values.industries ?? []).filter((sector) => !SECTOR_VALUES.has(sector));
  const moreFilled = hasAny([values.portfolioCompanies, values.yearEstablished, values.currentIncubatees, values.graduatedIncubatees, values.governmentPrograms]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title={isAccelerator ? "Your accelerator" : "Your incubator"}
        minutes={3}
        description="Founders find you by sector and location, then decide on your programmes. The first part takes a minute."
      />

      <FieldSection title="The organisation">
        <Controller
          control={control}
          name="kind"
          render={({ field }) => <ChoiceChips label="It's an" required options={KIND_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required autoComplete="organization" error={errors.organizationName?.message} {...register("organizationName")} />
          <Input
            label="Your role there"
            required
            autoComplete="organization-title"
            placeholder="Programme manager"
            error={errors.designation?.message}
            {...register("designation")}
          />
        </div>
        <Controller
          control={control}
          name="hostType"
          render={({ field }) => (
            <ChoiceChips label="Who runs it?" required options={HOST_OPTIONS} value={field.value} onChange={field.onChange} error={errors.hostType?.message} />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
          <Input label="State" autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
        </div>
        <ChoiceChips
          label="Sectors you back"
          required
          multiple
          options={SECTOR_OPTIONS}
          value={values.industries}
          onChange={(sector) => setValue("industries", toggle(values.industries, sector), { shouldValidate: !!errors.industries })}
          error={errors.industries?.message}
        />
        {customSectors.length > 0 && (
          <TagsInput
            label="Other sectors"
            value={customSectors}
            onChange={(custom) => setValue("industries", [...(values.industries ?? []).filter((sector) => SECTOR_VALUES.has(sector)), ...custom])}
          />
        )}
      </FieldSection>

      <FieldSection title="Your page" description="What founders see when they open it.">
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => <AvatarUpload kind="logo" value={field.value} onChange={field.onChange} />}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="Who you support, what founders get (space, mentors, funding) and how long the programme runs."
          error={errors.description?.message}
          {...register("description")}
        />
        <Input label="Website" placeholder="https://…" autoComplete="url" error={errors.website?.message} {...register("website")} />
      </FieldSection>

      <MoreDetails title="Track record and schemes" description="Optional. Self-declared, and shown as you enter it." defaultOpen={moreFilled}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Year started" type="number" inputMode="numeric" error={errors.yearEstablished?.message} {...register("yearEstablished")} />
          <Input label="Startups incubated now" type="number" inputMode="numeric" min={0} error={errors.currentIncubatees?.message} {...register("currentIncubatees")} />
          <Input label="Startups graduated" type="number" inputMode="numeric" min={0} error={errors.graduatedIncubatees?.message} {...register("graduatedIncubatees")} />
        </div>
        <ChoiceChips
          label="Government schemes you run under"
          multiple
          options={SCHEME_OPTIONS}
          value={values.governmentPrograms}
          onChange={(scheme) => setValue("governmentPrograms", toggle(values.governmentPrograms, scheme as GovernmentIncubatorProgram))}
        />
        <Controller
          control={control}
          name="portfolioCompanies"
          render={({ field }) => <TagsInput label="Startups you've backed" value={field.value ?? []} onChange={field.onChange} />}
        />
      </MoreDetails>

      <FieldSection title="Programmes" description="Optional. Add the ones founders can apply to now; each shows on your page with its link.">
        {programs.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-card border border-border p-4">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Input label="Programme name" required error={errors.programs?.[index]?.name?.message} {...register(`programs.${index}.name`)} />
                <Input label="Length (weeks)" type="number" inputMode="numeric" {...register(`programs.${index}.durationWeeks`)} />
                <Input label="Applications open" type="date" {...register(`programs.${index}.applicationCycleStart`)} />
                <Input label="Applications close" type="date" {...register(`programs.${index}.applicationCycleEnd`)} />
              </div>
              <button
                type="button"
                onClick={() => programs.remove(index)}
                aria-label={`Remove programme ${index + 1}`}
                className="mt-7 rounded-full p-1.5 text-text-secondary hover:bg-background-secondary hover:text-danger-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Input
              label="Who can apply"
              placeholder="Idea to MVP stage. Company registration not required."
              {...register(`programs.${index}.eligibilityCriteria`)}
            />
            <Input label="Application link" placeholder="https://…" error={errors.programs?.[index]?.applicationUrl?.message} {...register(`programs.${index}.applicationUrl`)} />
            <Textarea label="What founders get" rows={2} {...register(`programs.${index}.description`)} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => programs.append({ name: "" })}
          className="inline-flex items-center gap-1.5 self-start rounded-button border border-dashed border-border px-3.5 py-2 text-sm font-medium text-brand-primary hover:bg-background-secondary"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add a programme
        </button>
      </FieldSection>

      {publishError && (
        <p role="alert" className="rounded-button border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {publishError}
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={isPublishing} nextLabel={isEditing ? "Save changes" : "Publish profile"} />
    </form>
  );
}
