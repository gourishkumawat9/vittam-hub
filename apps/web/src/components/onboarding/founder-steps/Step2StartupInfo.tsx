"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
import {
  CompanyType,
  FundingStatus,
  Industry,
  ProductStatus,
  RegistrationStatus,
  RevenueStatus,
  StartupStage,
  startupInfoStepSchema,
  type StartupInfoStepInput,
} from "@vittamhub/types";
import { Input, Select, Textarea } from "@vittamhub/ui";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const STAGE_OPTIONS = Object.values(StartupStage).map((value) => ({ label: titleCase(value), value }));
const REGISTRATION_OPTIONS = Object.values(RegistrationStatus).map((value) => ({ label: titleCase(value), value }));
const COMPANY_TYPE_OPTIONS = Object.values(CompanyType).map((value) => ({ label: titleCase(value), value }));
const INDUSTRY_OPTIONS = Object.values(Industry).map((value) => ({ label: titleCase(value), value }));
const PRODUCT_STATUS_OPTIONS = Object.values(ProductStatus).map((value) => ({ label: titleCase(value), value }));
const REVENUE_STATUS_OPTIONS = Object.values(RevenueStatus).map((value) => ({ label: titleCase(value), value }));
const FUNDING_STATUS_OPTIONS = Object.values(FundingStatus).map((value) => ({ label: titleCase(value), value }));

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  const { status } = useAutosave("startupInfo", 1, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("startupInfo", data);
    onNext();
  });

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    const url = await uploadFile(file, "logos");
    setValue("logoUrl", url);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Startup information</h2>
        <p className="mt-1 text-sm text-text-secondary">The core facts that define your company.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Startup name" error={errors.name?.message} {...register("name")} />
        <Input label="Tagline" hint="A one-line pitch, max 160 characters" error={errors.tagline?.message} {...register("tagline")} />
      </div>

      <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Logo</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            className="text-sm text-text-secondary file:mr-3 file:rounded-button file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
          />
        </div>
        <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
      </div>

      <div>
        <p className="text-sm font-medium text-text-primary">Your actual stage</p>
        <p className="mt-1 text-xs text-text-secondary">
          Your public stage label is computed from these three — it can&apos;t be inflated by just picking one.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={control}
          name="productStatus"
          render={({ field }) => (
            <Select
              label="Product status"
              options={PRODUCT_STATUS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.productStatus?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="revenueStatus"
          render={({ field }) => (
            <Select
              label="Revenue status"
              options={REVENUE_STATUS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.revenueStatus?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="fundingStatus"
          render={({ field }) => (
            <Select
              label="Funding status"
              options={FUNDING_STATUS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.fundingStatus?.message}
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={control}
          name="stage"
          render={({ field }) => (
            <Select
              label="How would you describe your stage?"
              hint="Your own take — shown alongside the computed stage, never instead of it"
              options={STAGE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.stage?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="industry"
          render={({ field }) => (
            <Select
              label="Industry"
              options={INDUSTRY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.industry?.message}
            />
          )}
        />
        <Input label="Sub-industry" {...register("subIndustry")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Year founded" type="number" error={errors.foundedYear?.message} {...register("foundedYear")} />
        <Controller
          control={control}
          name="registrationStatus"
          render={({ field }) => (
            <Select label="Registration status" options={REGISTRATION_OPTIONS} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="companyType"
          render={({ field }) => <Select label="Company type" options={COMPANY_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Headquarters" hint="City, Country" error={errors.headquarters?.message} {...register("headquarters")} />
        <Input label="Business model" hint='e.g. "Subscription", "Marketplace take-rate"' {...register("businessModelSummary")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea label="Mission" rows={2} {...register("mission")} />
        <Textarea label="Vision" rows={2} {...register("vision")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea label="Problem statement" rows={3} {...register("problemStatement")} />
        <Textarea label="Solution" rows={3} {...register("solution")} />
      </div>
      <Textarea label="Unique value proposition" rows={2} {...register("uniqueValueProposition")} />

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
