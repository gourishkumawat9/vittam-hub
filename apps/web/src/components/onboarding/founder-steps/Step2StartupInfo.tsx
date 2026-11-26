"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  startupInfoStepSchema,
  type CompanyType,
  type FundingStatus,
  type Industry,
  type ProductStatus,
  type RegistrationStatus,
  type RevenueStatus,
  type StartupInfoStepInput,
  type StartupStage,
} from "@vittamhub/types";
import { Input, Select, Textarea } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { AvatarUpload } from "@/components/AvatarUpload";
import { useAutosave } from "@/hooks/useAutosave";
import { usePersona } from "@/hooks/usePersona";
import {
  COMPANY_TYPE_LABEL,
  FUNDING_STATUS_LABEL,
  INDUSTRY_LABEL,
  optionsFrom,
  PRODUCT_STATUS_LABEL,
  REGISTRATION_LABEL,
  REVENUE_STATUS_LABEL,
  STAGE_LABEL,
} from "@/lib/startup-options";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const STAGE_OPTIONS = optionsFrom<StartupStage>(STAGE_LABEL);
const PRODUCT_OPTIONS = optionsFrom<ProductStatus>(PRODUCT_STATUS_LABEL);
const REVENUE_OPTIONS = optionsFrom<RevenueStatus>(REVENUE_STATUS_LABEL);
const FUNDING_OPTIONS = optionsFrom<FundingStatus>(FUNDING_STATUS_LABEL);
const REGISTRATION_OPTIONS = optionsFrom<RegistrationStatus>(REGISTRATION_LABEL);
const COMPANY_TYPE_OPTIONS = optionsFrom<CompanyType>(COMPANY_TYPE_LABEL).filter((option) => option.value !== "NOT_REGISTERED");
/** The labels BHASKAR and the MCA use for each company type's registration number. */
const REGISTRATION_NUMBER_LABEL: Partial<Record<CompanyType, string>> = {
  PRIVATE_LIMITED: "CIN",
  PUBLIC_LIMITED: "CIN",
  ONE_PERSON_COMPANY: "CIN",
  SECTION_8_COMPANY: "CIN",
  LLP: "LLPIN",
};
const INDUSTRY_OPTIONS = optionsFrom<Industry>(INDUSTRY_LABEL);

interface StepProps {
  defaultValues?: Partial<StartupInfoStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step2StartupInfo({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const draft = useOnboardingStore((s) => s.draft);
  const { persona, isIdeaStage } = usePersona();
  // Asked once already: the city from "About you" is where the startup is based, until said otherwise.
  const city = draftSection<{ city?: string }>(draft, "personalDetails")?.city;
  // Someone exploring an idea starts at the idea stage, unregistered; they can change any of it.
  const ideaDefaults: Partial<StartupInfoStepInput> =
    persona === "EXPLORER" ? { stage: "IDEA", productStatus: "CONCEPT", revenueStatus: "NONE", fundingStatus: "BOOTSTRAPPED", registrationStatus: "NOT_REGISTERED" } : {};

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StartupInfoStepInput>({
    resolver: zodResolver(startupInfoStepSchema),
    defaultValues: { ...ideaDefaults, headquarters: city, ...defaultValues },
  });

  const values = watch();
  useAutosave("startupInfo", 1, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("startupInfo", data);
    onNext();
  });

  const moreFilled = hasAny([
    values.businessModelSummary,
    values.problemStatement,
    values.solution,
    values.uniqueValueProposition,
    values.mission,
    values.vision,
  ]);
  const taglineLength = (values.tagline ?? "").length;
  const registered = values.registrationStatus === "REGISTERED" || values.registrationStatus === "IN_PROGRESS";
  const numberLabel = (values.companyType && REGISTRATION_NUMBER_LABEL[values.companyType]) ?? "Registration number";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title={isIdeaStage ? "Your idea" : "Your startup"}
        minutes={2}
        description={
          isIdeaStage
            ? "No company needed. Give the idea a working name and say what it does; you can change any of it as it grows."
            : "What investors and mentors see first. Keep it short: product, traction and team can be added after you publish."
        }
      />

      <FieldSection title="The basics">
        <div className="flex flex-col gap-4">
          <Input
            label={isIdeaStage ? "Working name" : "Startup name"}
            required
            placeholder="Acme Health"
            hint={isIdeaStage ? "A working name is fine" : undefined}
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="One line pitch"
            required
            maxLength={160}
            placeholder="Daily study plans for college students that adapt when they fall behind"
            hint={`${taglineLength} of 160 characters`}
            error={errors.tagline?.message}
            {...register("tagline")}
          />
        </div>

        <Textarea
          label="What you do"
          required
          rows={3}
          placeholder="Who has the problem, what you built for them, and why now. Two or three plain sentences."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="industry"
            render={({ field }) => (
              <Select
                label="Industry"
                required
                placeholder="Choose one"
                options={INDUSTRY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.industry?.message}
              />
            )}
          />
          <Input label="Sub industry" placeholder="Exam preparation" error={errors.subIndustry?.message} {...register("subIndustry")} />
          <Input label="Based in" required placeholder="Jaipur, India" error={errors.headquarters?.message} {...register("headquarters")} />
          <Input
            label="Year you started"
            type="number"
            inputMode="numeric"
            placeholder={String(new Date().getFullYear())}
            hint="When you started working on it, registered or not"
            error={errors.foundedYear?.message}
            {...register("foundedYear")}
          />
          <Input label="Website" placeholder="https://…" autoComplete="url" error={errors.website?.message} {...register("website")} />
        </div>

        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <AvatarUpload
              kind="logo"
              value={field.value}
              onChange={(url) => setValue("logoUrl", url, { shouldDirty: true })}
              hint="Optional. A square logo works best; you'll crop it before it's saved."
            />
          )}
        />
      </FieldSection>

      <FieldSection
        title="Where you are today"
        description="A tap each. The stage on your profile is worked out from product, revenue and funding, so it stays honest for everyone."
      >
        <Controller
          control={control}
          name="stage"
          render={({ field }) => (
            <ChoiceChips label="Your stage, in your words" required options={STAGE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.stage?.message} />
          )}
        />
        <Controller
          control={control}
          name="productStatus"
          render={({ field }) => (
            <ChoiceChips label="Product" required options={PRODUCT_OPTIONS} value={field.value} onChange={field.onChange} error={errors.productStatus?.message} />
          )}
        />
        <Controller
          control={control}
          name="revenueStatus"
          render={({ field }) => (
            <ChoiceChips label="Revenue" required options={REVENUE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.revenueStatus?.message} />
          )}
        />
        <Controller
          control={control}
          name="fundingStatus"
          render={({ field }) => (
            <ChoiceChips
              label="Funding so far"
              required
              options={FUNDING_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.fundingStatus?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="registrationStatus"
          render={({ field }) => (
            <ChoiceChips
              label="Is the company registered?"
              required
              hint="Not registered yet is fine. Many founders start here."
              options={REGISTRATION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.registrationStatus?.message}
            />
          )}
        />
        {registered && (
          <div className="flex flex-col gap-4 rounded-card border border-border bg-background-secondary/50 p-4">
            <Controller
              control={control}
              name="companyType"
              render={({ field }) => (
                <ChoiceChips label="Company type" options={COMPANY_TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.companyType?.message} />
              )}
            />
            {values.registrationStatus === "REGISTERED" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={numberLabel}
                  placeholder={numberLabel === "LLPIN" ? "AAM-6731" : "U72900KA2018PTC110746"}
                  autoCapitalize="characters"
                  hint="Optional. Lets us check it automatically when that's switched on"
                  error={errors.registrationNumber?.message}
                  {...register("registrationNumber")}
                />
                <Input
                  label="DPIIT recognition number"
                  placeholder="DIPP12345"
                  autoCapitalize="characters"
                  hint="Optional. Only if you're recognised by DPIIT"
                  error={errors.dpiitNumber?.message}
                  {...register("dpiitNumber")}
                />
              </div>
            )}
          </div>
        )}
      </FieldSection>

      <MoreDetails
        title="Tell the fuller story"
        description="Optional. Problem, solution and what makes you different, for investors who want more."
        defaultOpen={moreFilled}
      >
        <Input label="Business model" placeholder="Subscription, or marketplace commission" {...register("businessModelSummary")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="The problem" rows={3} {...register("problemStatement")} />
          <Textarea label="Your solution" rows={3} {...register("solution")} />
        </div>
        <Textarea label="What makes you different" rows={2} {...register("uniqueValueProposition")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Mission" rows={2} {...register("mission")} />
          <Textarea label="Vision" rows={2} {...register("vision")} />
        </div>
      </MoreDetails>

      <WizardNav onBack={onBack} onNext={onSubmit} />
    </form>
  );
}
