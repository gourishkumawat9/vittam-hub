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

const GENDER_OPTIONS = [
  { label: "Male", value: Gender.MALE },
  { label: "Female", value: Gender.FEMALE },
  { label: "Non-binary", value: Gender.NON_BINARY },
  { label: "Prefer not to say", value: Gender.PREFER_NOT_TO_SAY },
];

export function Step1PersonalDetails({
  defaultValues,
  onNext,
}: {
  defaultValues?: Partial<PersonalDetailsInput>;
  onNext: () => void;
}) {
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
  const { status } = useAutosave("personalDetails", 0, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("personalDetails", data);
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Founder information</h2>
        <p className="mt-1 text-sm text-text-secondary">Tell us about yourself — this appears on your public profile.</p>
      </div>

      <Controller
        control={control}
        name="avatarUrl"
        render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" value={user?.email ?? ""} disabled hint="Set at registration" />
        <Input label="Mobile number" error={errors.mobileNumber?.message} {...register("mobileNumber")} />
        <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select label="Gender" options={GENDER_OPTIONS} value={field.value} onChange={field.onChange} error={errors.gender?.message} />
          )}
        />
        <Input label="Nationality" error={errors.nationality?.message} {...register("nationality")} />
        <Input label="LinkedIn" placeholder="https://linkedin.com/in/…" error={errors.linkedinUrl?.message} {...register("linkedinUrl")} />
        <Input label="GitHub" placeholder="https://github.com/…" error={errors.githubUrl?.message} {...register("githubUrl")} />
        <Input
          label="Portfolio website"
          placeholder="https://…"
          error={errors.portfolioUrl?.message}
          {...register("portfolioUrl")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="City" error={errors.city?.message} {...register("city")} />
        <Input label="State" error={errors.state?.message} {...register("state")} />
        <Input label="Country" error={errors.country?.message} {...register("country")} />
      </div>

      <Textarea label="Short bio" rows={3} hint="A couple of sentences about your background" {...register("bio")} />

      <WizardNav onNext={onSubmit} isFirstStep isSubmitting={status === "saving"} />
    </form>
  );
}
