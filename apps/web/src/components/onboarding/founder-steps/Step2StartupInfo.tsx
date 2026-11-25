"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
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
import { ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
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
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const STAGE_OPTIONS = optionsFrom<StartupStage>(STAGE_LABEL);
const PRODUCT_OPTIONS = optionsFrom<ProductStatus>(PRODUCT_STATUS_LABEL);
const REVENUE_OPTIONS = optionsFrom<RevenueStatus>(REVENUE_STATUS_LABEL);
const FUNDING_OPTIONS = optionsFrom<FundingStatus>(FUNDING_STATUS_LABEL);
const REGISTRATION_OPTIONS = optionsFrom<RegistrationStatus>(REGISTRATION_LABEL);
const COMPANY_TYPE_OPTIONS = optionsFrom<CompanyType>(COMPANY_TYPE_LABEL).filter((option) => option.value !== "NOT_REGISTERED");
const INDUSTRY_OPTIONS = optionsFrom<Industry>(INDUSTRY_LABEL);

interface StepProps {
  defaultValues?: Partial<StartupInfoStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step2StartupInfo({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StartupInfoStepInput>({
    resolver: zodResolver(startupInfoStepSchema),
    defaultValues,
  });

  const values = watch();
  useAutosave("startupInfo", 1, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("startupInfo", data);
    onNext();
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoUrl = values.logoUrl;

  // A failed upload used to do nothing visible, and nothing showed that one had worked either.
  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, "logos");
      setValue("logoUrl", url, { shouldDirty: true });
    } catch (cause) {
      setLogoError(cause instanceof Error && cause.message ? cause.message : "That logo couldn't be uploaded. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  const moreFilled = hasAny([
    values.subIndustry,
    values.businessModelSummary,
    values.problemStatement,
    values.solution,
    values.uniqueValueProposition,
    values.mission,
    values.vision,
  ]);
  const taglineLength = (values.tagline ?? "").length;
  const registered = values.registrationStatus === "REGISTERED" || values.registrationStatus === "IN_PROGRESS";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title="Your startup"
        minutes={2}
        description="What investors and mentors see first. Keep it short: product, traction and team can be added after you publish."
      />

      <FieldSection title="The basics">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Logo</span>
            <label className="group relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center overflow-hidden rounded-card border border-dashed border-border bg-background-secondary transition-colors hover:border-brand-300 focus-within:ring-2 focus-within:ring-brand-primary">
              {logoUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-text-secondary" aria-hidden />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL
                <img src={logoUrl} alt="Your logo" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-text-secondary">
                  <ImageIcon className="h-5 w-5" aria-hidden />
                  <span className="text-[11px] font-medium">Upload</span>
                </span>
              )}
              <span className="sr-only">{logoUrl ? "Change logo" : "Upload logo"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={logoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void handleLogoUpload(file);
                }}
              />
            </label>
            {logoUrl && !logoUploading && (
              <button
                type="button"
                onClick={() => setValue("logoUrl", "", { shouldDirty: true })}
                className="self-start text-xs text-text-secondary hover:text-text-primary"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Input label="Startup name" required placeholder="Acme Health" error={errors.name?.message} {...register("name")} />
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
        </div>
        {logoError && (
          <p className="text-xs text-danger-600" role="alert">
            {logoError}
          </p>
        )}

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
          <Input label="Based in" required placeholder="Jaipur, India" error={errors.headquarters?.message} {...register("headquarters")} />
          <Input
            label="Year founded"
            required
            type="number"
            inputMode="numeric"
            placeholder={String(new Date().getFullYear())}
            error={errors.foundedYear?.message}
            {...register("foundedYear")}
          />
          <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
        </div>
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
          <div className="max-w-sm">
            <Controller
              control={control}
              name="companyType"
              render={({ field }) => (
                <Select label="Company type" placeholder="Choose one" options={COMPANY_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        )}
      </FieldSection>

      <MoreDetails
        title="Tell the fuller story"
        description="Optional. Problem, solution and what makes you different, for investors who want more."
        defaultOpen={moreFilled}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Sub industry" placeholder="Exam preparation" {...register("subIndustry")} />
          <Input label="Business model" placeholder="Subscription, or marketplace commission" {...register("businessModelSummary")} />
        </div>
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
