"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser } from "@vittamhub/api-client";
import { Gender, personalDetailsInputSchema, type PersonalDetailsInput } from "@vittamhub/types";
import { Input, Select, Textarea } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { AvatarUpload } from "@/components/AvatarUpload";
import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { hasAny, MoreDetails, StepHeader } from "../fields";

const GENDER_OPTIONS = [
  { label: "Male", value: Gender.MALE },
  { label: "Female", value: Gender.FEMALE },
  { label: "Non-binary", value: Gender.NON_BINARY },
  { label: "Prefer not to say", value: Gender.PREFER_NOT_TO_SAY },
];

interface PersonalDetailsStepProps {
  defaultValues?: Partial<PersonalDetailsInput>;
  onNext: () => void;
  /** Says who will see these details, in the words of the role signing up. */
  description?: string;
  linkedinHint?: string;
  bioPlaceholder?: string;
}

/**
 * The first step of every role's sign-up: who you are. Asks only for a name,
 * a mobile number and a city (plus a photo, LinkedIn and a line about you,
 * which make the profile worth opening); the rest is folded under
 * "More about you" and can wait.
 */
export function PersonalDetailsStep({
  defaultValues,
  onNext,
  description = "People on VittamHub meet you before anything else. Your name, photo and a line about you are shown on your profile.",
  linkedinHint = "The quickest way for people to learn who you are",
  bioPlaceholder = "What you do today, and what you did before.",
}: PersonalDetailsStepProps) {
  const { data: user } = useCurrentUser();
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PersonalDetailsInput>({
    resolver: zodResolver(personalDetailsInputSchema),
    defaultValues: { fullName: user?.fullName, ...defaultValues },
  });

  const values = watch();
  useAutosave("personalDetails", 0, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("personalDetails", data);
    onNext();
  });

  const moreFilled = hasAny([
    values.dateOfBirth,
    values.gender,
    values.nationality,
    values.githubUrl,
    values.portfolioUrl,
    values.yearsOfExperience,
    values.state,
    values.country,
  ]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <StepHeader
        title="About you"
        minutes={1}
        description={description}
      />

      <div className="flex flex-col gap-5">
        <Controller
          control={control}
          name="avatarUrl"
          render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} />}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
          <Input label="Email" value={user?.email ?? ""} disabled hint="The one you signed up with" />
          <Input
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            hint="Private. Only used to reach you about your account"
            error={errors.mobileNumber?.message}
            {...register("mobileNumber")}
          />
          <Input label="City" autoComplete="address-level2" placeholder="Jaipur" error={errors.city?.message} {...register("city")} />
        </div>

        <Input
          label="LinkedIn"
          placeholder="https://linkedin.com/in/…"
          hint={linkedinHint}
          error={errors.linkedinUrl?.message}
          {...register("linkedinUrl")}
        />

        <Textarea
          label="A line about you"
          rows={2}
          placeholder={bioPlaceholder}
          hint="One or two sentences on your background"
          {...register("bio")}
        />
      </div>

      <MoreDetails
        title="More about you"
        description="Optional. Add these now or any time from your profile."
        defaultOpen={moreFilled}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Years of experience"
            type="number"
            min={0}
            hint="Lets investors filter by founder experience"
            error={errors.yearsOfExperience?.message}
            {...register("yearsOfExperience")}
          />
          <Input label="GitHub" placeholder="https://github.com/…" error={errors.githubUrl?.message} {...register("githubUrl")} />
          <Input label="Portfolio website" placeholder="https://…" error={errors.portfolioUrl?.message} {...register("portfolioUrl")} />
          <Input label="Date of birth" type="date" hint="Private" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select label="Gender" options={GENDER_OPTIONS} value={field.value} onChange={field.onChange} error={errors.gender?.message} />
            )}
          />
          <Input label="Nationality" error={errors.nationality?.message} {...register("nationality")} />
          <Input label="State" autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
          <Input label="Country" autoComplete="country-name" error={errors.country?.message} {...register("country")} />
        </div>
      </MoreDetails>

      <WizardNav onNext={onSubmit} isFirstStep />
    </form>
  );
}
