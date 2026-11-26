"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMentorInputSchema,
  MENTOR_SESSION_LENGTHS,
  mentorFeeLabel,
  type CreateMentorInput,
  type MeetingMode,
  type MentorFeeType,
  type MentorType,
  type SessionType,
  type StartupStage,
} from "@vittamhub/types";
import { Checkbox, Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { SESSION_TYPE_LABEL } from "@/components/dashboard/mentor/labels";
import { useAutosave } from "@/hooks/useAutosave";
import { usePublishProfile } from "@/hooks/usePublishProfile";
import {
  hintedOptions,
  MEETING_MODE_LABEL,
  MENTOR_EXPERTISE_OPTIONS,
  MENTOR_FEE_TYPE_LABEL,
  MENTOR_TYPE_HINT,
  MENTOR_TYPE_LABEL,
  plainOptions,
} from "@/lib/signup-options";
import { optionsFrom, STAGE_LABEL } from "@/lib/startup-options";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const SESSION_TYPE_OPTIONS = optionsFrom<SessionType>(SESSION_TYPE_LABEL);
const MENTOR_TYPE_OPTIONS = hintedOptions<MentorType>(MENTOR_TYPE_LABEL, MENTOR_TYPE_HINT);
const STAGE_OPTIONS = optionsFrom<StartupStage>(STAGE_LABEL);
const MEETING_OPTIONS = optionsFrom<MeetingMode>(MEETING_MODE_LABEL);
const FEE_OPTIONS = optionsFrom<MentorFeeType>(MENTOR_FEE_TYPE_LABEL);
const EXPERTISE_OPTIONS = plainOptions(MENTOR_EXPERTISE_OPTIONS);
const LENGTH_OPTIONS = MENTOR_SESSION_LENGTHS.map((minutes) => ({ value: String(minutes), label: `${minutes} min` }));

interface MentorInfoStepProps {
  defaultValues?: Partial<CreateMentorInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
}

/**
 * A mentor's profile. BHASKAR asks a mentor for their kind of experience, the
 * sectors and stages they help with and how they engage; VittamHub adds the
 * fee (free or paid, per session of a set length, optionally a free first
 * session), since founders book mentors here. The fee is shown on the profile;
 * no payment is taken through VittamHub yet.
 */
export function MentorInfoStep({ defaultValues, onBack, isEditing = false }: MentorInfoStepProps) {
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMentorInput>({
    resolver: zodResolver(createMentorInputSchema),
    defaultValues: {
      expertise: [],
      industries: [],
      sessionTypes: [],
      languages: [],
      pastStartups: [],
      stagesHelped: [],
      firstSessionFree: false,
      ...defaultValues,
    },
  });

  const values = watch();
  useAutosave("mentorInfo", 1, values);

  const onSubmit = handleSubmit((data) =>
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ mentorInfo: data }, { isEditing, redirectTo: (profile) => `/mentors/${profile.id}` }),
  );

  const paid = values.feeType === "PAID";
  const feePreview = mentorFeeLabel({
    feeType: values.feeType,
    sessionFeeAmount: values.sessionFeeAmount ? Number(values.sessionFeeAmount) : null,
    sessionLengthMinutes: values.sessionLengthMinutes ? Number(values.sessionLengthMinutes) : null,
    firstSessionFree: values.firstSessionFree,
  });
  // Areas typed in that aren't one of the chips are kept, shown in the box below the chips.
  const customExpertise = (values.expertise ?? []).filter((area) => !(MENTOR_EXPERTISE_OPTIONS as readonly string[]).includes(area));
  const moreFilled = hasAny([values.industries, values.yearsExperience, values.languages, values.pastStartups]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title="Your mentor profile"
        minutes={3}
        description="Founders choose a mentor on what you've done, what you help with, how you meet and what it costs. A tap each for most of it."
      />

      <FieldSection title="Who you are as a mentor">
        <Input
          label="Headline"
          required
          placeholder="Ex product lead at a payments company. Pricing and go to market."
          hint="One line founders read first in the mentor directory"
          error={errors.headline?.message}
          {...register("headline")}
        />
        <Controller
          control={control}
          name="mentorType"
          render={({ field }) => (
            <ChoiceChips
              label="What kind of mentor are you?"
              required
              options={MENTOR_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.mentorType?.message}
            />
          )}
        />
      </FieldSection>

      <FieldSection title="What you help with">
        <div className="flex flex-col gap-3">
          <ChoiceChips
            label="Areas"
            required
            multiple
            hint="Pick all that fit, and type any others below"
            options={EXPERTISE_OPTIONS}
            value={values.expertise}
            onChange={(area) => setValue("expertise", toggle(values.expertise, area), { shouldValidate: !!errors.expertise })}
            error={errors.expertise?.message}
          />
          <TagsInput
            label="Other areas"
            hint="Press Enter after each one"
            value={customExpertise}
            onChange={(custom) =>
              setValue("expertise", [...(values.expertise ?? []).filter((area) => (MENTOR_EXPERTISE_OPTIONS as readonly string[]).includes(area)), ...custom])
            }
          />
        </div>
        <ChoiceChips
          label="Stages you help at"
          required
          multiple
          options={STAGE_OPTIONS}
          value={values.stagesHelped}
          onChange={(stage) => setValue("stagesHelped", toggle(values.stagesHelped, stage), { shouldValidate: !!errors.stagesHelped })}
          error={errors.stagesHelped?.message}
        />
      </FieldSection>

      <FieldSection title="How founders book you">
        <ChoiceChips
          label="Kinds of session"
          required
          multiple
          options={SESSION_TYPE_OPTIONS}
          value={values.sessionTypes}
          onChange={(type) => setValue("sessionTypes", toggle(values.sessionTypes, type), { shouldValidate: !!errors.sessionTypes })}
          error={errors.sessionTypes?.message}
        />
        <Controller
          control={control}
          name="meetingMode"
          render={({ field }) => (
            <ChoiceChips label="Where you meet" required options={MEETING_OPTIONS} value={field.value} onChange={field.onChange} error={errors.meetingMode?.message} />
          )}
        />
        <Input
          label="When founders can book you"
          required
          placeholder="Weekday evenings, about 2 hours a week"
          error={errors.availability?.message}
          {...register("availability")}
        />
      </FieldSection>

      <FieldSection title="Your fee" description="Shown on your profile so founders know before they ask. Payments aren't taken through VittamHub yet; you agree them with the founder.">
        <Controller
          control={control}
          name="feeType"
          render={({ field }) => (
            <ChoiceChips label="Are your sessions free or paid?" required options={FEE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.feeType?.message} />
          )}
        />
        {paid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fee per session (₹)"
              required
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="2000"
              error={errors.sessionFeeAmount?.message}
              {...register("sessionFeeAmount")}
            />
            <Controller
              control={control}
              name="firstSessionFree"
              render={({ field }) => (
                <div className="flex items-end pb-2.5">
                  <Checkbox checked={field.value === true} onCheckedChange={field.onChange} label="First session is free" />
                </div>
              )}
            />
          </div>
        )}
        <ChoiceChips
          label="Session length"
          required={paid}
          options={LENGTH_OPTIONS}
          value={values.sessionLengthMinutes ? String(values.sessionLengthMinutes) : undefined}
          onChange={(minutes) => setValue("sessionLengthMinutes", Number(minutes), { shouldValidate: !!errors.sessionLengthMinutes })}
          error={errors.sessionLengthMinutes?.message}
        />
        {feePreview && (
          <p className="caption-5">
            Founders will see: <span className="font-semibold text-text-primary">{feePreview}</span>
          </p>
        )}
      </FieldSection>

      <MoreDetails title="More about your mentoring" description="Optional. These help founders filter, and you can add them any time." defaultOpen={moreFilled}>
        <Controller
          control={control}
          name="industries"
          render={({ field }) => (
            <TagsInput label="Industries you know well" value={field.value ?? []} onChange={field.onChange} error={errors.industries?.message} />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Years of experience" type="number" min={0} error={errors.yearsExperience?.message} {...register("yearsExperience")} />
        </div>
        <Controller
          control={control}
          name="languages"
          render={({ field }) => (
            <TagsInput label="Languages" hint="Press Enter after each one, for example English, Hindi" value={field.value ?? []} onChange={field.onChange} error={errors.languages?.message} />
          )}
        />
        <Controller
          control={control}
          name="pastStartups"
          render={({ field }) => <TagsInput label="Startups you have helped before" value={field.value ?? []} onChange={field.onChange} />}
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
