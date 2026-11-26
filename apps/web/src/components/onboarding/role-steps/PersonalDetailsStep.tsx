"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser } from "@vittamhub/api-client";
import { Gender, personalDetailsInputSchema, type PersonalDetailsInput } from "@vittamhub/types";
import { Input, Select, Textarea } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { AvatarUpload } from "@/components/AvatarUpload";
import { useAutosave } from "@/hooks/useAutosave";
import { usePersona } from "@/hooks/usePersona";
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
 * The first step of every role's sign-up: who you are. Name, mobile and
 * nationality come from the sign-up form already; this asks for a city (and,
 * for a student, their college), plus a photo, LinkedIn and a line about you,
 * which make the profile worth opening. The rest, including a BHASKAR ID for
 * anyone who has one, is folded under "More about you" and can wait.
 */
export function PersonalDetailsStep({
  defaultValues,
  onNext,
  description = "People on VittamHub meet you before anything else. Your name, photo and a line about you are shown on your profile.",
  linkedinHint = "The quickest way for people to learn who you are",
  bioPlaceholder = "What you do today, and what you did before.",
}: PersonalDetailsStepProps) {
  const { data: user } = useCurrentUser();
  const { isStudent, isOrganisation } = usePersona();
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<PersonalDetailsInput>({
    resolver: zodResolver(personalDetailsInputSchema),
    defaultValues: { fullName: user?.fullName, ...defaultValues },
  });

  const values = watch();
  useAutosave("personalDetails", 0, values);

  const onSubmit = handleSubmit((data) => {
    // The shared schema doesn't know the persona; a student's college is checked here (and again on publish).
    if (isStudent && !data.studentInstitution) {
      setError("studentInstitution", { message: "Add the college or university you study at" }, { shouldFocus: true });
      return;
    }
    setSectionData("personalDetails", data);
    onNext();
  });

  const moreFilled = hasAny([
    values.dateOfBirth,
    values.gender,
    values.githubUrl,
    values.portfolioUrl,
    values.yearsOfExperience,
    values.country,
    values.bhaskarId,
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
          render={({ field }) => (
            <AvatarUpload
              value={field.value}
              onChange={field.onChange}
              hint={
                isOrganisation
                  ? "Your own photo, shown beside your name on the organisation's page. You'll crop it before it's saved."
                  : "A clear, front-facing photo builds trust. You'll crop it before it's saved."
              }
            />
          )}
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
          <Input label="City" required autoComplete="address-level2" placeholder="Jaipur" error={errors.city?.message} {...register("city")} />
          <Input label="State" autoComplete="address-level1" placeholder="Rajasthan" error={errors.state?.message} {...register("state")} />
        </div>

        {isStudent && (
          <div className="grid gap-4 rounded-card border border-border bg-background-secondary/50 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="College or university"
                required
                autoComplete="organization"
                placeholder="IIT Bombay"
                hint="Opens campus programmes and E-cells meant for students"
                error={errors.studentInstitution?.message}
                {...register("studentInstitution")}
              />
            </div>
            <Input label="Course" placeholder="B.Tech, Computer Science" error={errors.studentCourse?.message} {...register("studentCourse")} />
            <Input
              label="Graduation year"
              type="number"
              inputMode="numeric"
              placeholder={String(new Date().getFullYear() + 2)}
              error={errors.graduationYear?.message}
              {...register("graduationYear")}
            />
          </div>
        )}

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
          <Input label="Country" autoComplete="country-name" error={errors.country?.message} {...register("country")} />
          <Input
            label="BHASKAR ID"
            placeholder="BHA000000123"
            autoCapitalize="characters"
            hint="If you're registered on Startup India's BHASKAR. Shown as self-declared."
            error={errors.bhaskarId?.message}
            {...register("bhaskarId")}
          />
        </div>
      </MoreDetails>

      <WizardNav onNext={onSubmit} isFirstStep />
    </form>
  );
}
