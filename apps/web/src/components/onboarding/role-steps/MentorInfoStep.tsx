"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding } from "@vittamhub/api-client";
import { createMentorInputSchema, SessionType, type CreateMentorInput } from "@vittamhub/types";
import { Input, TagsInput } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const SESSION_TYPE_OPTIONS = Object.values(SessionType);

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface MentorInfoStepProps {
  defaultValues?: Partial<CreateMentorInput>;
  onBack: () => void;
}

export function MentorInfoStep({ defaultValues, onBack }: MentorInfoStepProps) {
  const router = useRouter();
  const { setSectionData, reset } = useOnboardingStore();
  const publish = usePublishOnboarding();
  const [publishError, setPublishError] = useState<string | null>(null);

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
  const { status } = useAutosave("mentorInfo", 1, values);

  const toggleSessionType = (type: SessionType) => {
    const current = values.sessionTypes ?? [];
    setValue("sessionTypes", current.includes(type) ? current.filter((t) => t !== type) : [...current, type]);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("mentorInfo", data);
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
        <h2 className="font-heading text-xl font-semibold text-text-primary">Mentor profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Help founders find you for the right kind of guidance.</p>
      </div>

      <Input label="Headline" hint='e.g. "Ex-Stripe PM, GTM & growth"' error={errors.headline?.message} {...register("headline")} />

      <Controller
        control={control}
        name="expertise"
        render={({ field }) => (
          <TagsInput label="Areas of expertise" value={field.value ?? []} onChange={field.onChange} error={errors.expertise?.message} />
        )}
      />
      <Controller
        control={control}
        name="industries"
        render={({ field }) => (
          <TagsInput label="Industries" value={field.value ?? []} onChange={field.onChange} error={errors.industries?.message} />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Years of experience" type="number" error={errors.yearsExperience?.message} {...register("yearsExperience")} />
        <Input label="Availability" hint='e.g. "2 hours / week"' error={errors.availability?.message} {...register("availability")} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Session types</span>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleSessionType(type)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                (values.sessionTypes ?? []).includes(type)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {titleCase(type)}
            </button>
          ))}
        </div>
        {errors.sessionTypes?.message && <p className="text-xs text-danger-600">{errors.sessionTypes.message}</p>}
      </div>

      <Input label="Pricing model" hint='e.g. "Free", "$100/session"' error={errors.pricingModel?.message} {...register("pricingModel")} />

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
        render={({ field }) => <TagsInput label="Past startups you've worked with" value={field.value ?? []} onChange={field.onChange} />}
      />

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
