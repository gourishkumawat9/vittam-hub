"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createMentorInputSchema, type CreateMentorInput, type SessionType } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { SESSION_TYPE_LABEL } from "@/components/dashboard/mentor/labels";
import { useAutosave } from "@/hooks/useAutosave";
import { usePublishProfile } from "@/hooks/usePublishProfile";
import { optionsFrom } from "@/lib/startup-options";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, hasAny, MoreDetails, StepHeader } from "../fields";

const SESSION_TYPE_OPTIONS = optionsFrom<SessionType>(SESSION_TYPE_LABEL);

interface MentorInfoStepProps {
  defaultValues?: Partial<CreateMentorInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

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
    defaultValues: { expertise: [], industries: [], sessionTypes: [], languages: [], pastStartups: [], ...defaultValues },
  });

  const values = watch();
  useAutosave("mentorInfo", 1, values);

  const toggleSessionType = (type: SessionType) => {
    const current = values.sessionTypes ?? [];
    setValue("sessionTypes", current.includes(type) ? current.filter((t) => t !== type) : [...current, type]);
  };

  const onSubmit = handleSubmit((data) =>
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ mentorInfo: data }, { isEditing, redirectTo: (profile) => `/mentors/${profile.id}` }),
  );

  const moreFilled = hasAny([values.industries, values.yearsExperience, values.pricingModel, values.languages, values.pastStartups]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <StepHeader
        title="Your mentor profile"
        minutes={2}
        description="Founders choose a mentor on four things: what you have done, what you can help with, how you like to meet and when you are free. That is all we ask for now."
      />

      <div className="flex flex-col gap-5">
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
          name="expertise"
          render={({ field }) => (
            <TagsInput
              label="What you can help with"
              hint="Press Enter after each one, for example Pricing, Fundraising, Hiring"
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.expertise?.message}
            />
          )}
        />

        <ChoiceChips
          label="How you like to meet"
          required
          multiple
          options={SESSION_TYPE_OPTIONS}
          value={values.sessionTypes}
          onChange={toggleSessionType}
          error={errors.sessionTypes?.message}
        />

        <Input
          label="When founders can book you"
          required
          placeholder="Weekday evenings, about 2 hours a week"
          error={errors.availability?.message}
          {...register("availability")}
        />
      </div>

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
          <Input label="Fee" placeholder="Free, or ₹2,000 a session" error={errors.pricingModel?.message} {...register("pricingModel")} />
        </div>
        <Controller
          control={control}
          name="languages"
          render={({ field }) => (
            <TagsInput label="Languages" value={field.value ?? []} onChange={field.onChange} error={errors.languages?.message} />
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
