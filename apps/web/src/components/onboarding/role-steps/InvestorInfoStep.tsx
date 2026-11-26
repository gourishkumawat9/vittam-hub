"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createInvestorInputSchema, Industry, SEBI_CATEGORIES, type CreateInvestorInput, type InvestorType, type StartupStage } from "@vittamhub/types";
import { Checkbox, Input, TagsInput, Textarea } from "@vittamhub/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { usePersona } from "@/hooks/usePersona";
import { usePublishProfile } from "@/hooks/usePublishProfile";
import { CHEQUE_SIZE_RANGES, FIRM_INVESTOR_TYPES, INVESTOR_TYPE_LABEL, SEBI_CATEGORY_LABEL } from "@/lib/signup-options";
import { INDUSTRY_LABEL, optionsFrom, STAGE_LABEL } from "@/lib/startup-options";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { ChoiceChips, FieldSection, hasAny, MoreDetails, StepHeader } from "../fields";

const FIRM_TYPE_OPTIONS = FIRM_INVESTOR_TYPES.map((value) => ({ value: value as InvestorType, label: INVESTOR_TYPE_LABEL[value] ?? value }));
const STAGE_OPTIONS = optionsFrom<StartupStage>(STAGE_LABEL);
const SECTOR_OPTIONS = optionsFrom(INDUSTRY_LABEL);
const SECTOR_VALUES = new Set<string>(Object.values(Industry));
const CHEQUE_OPTIONS = CHEQUE_SIZE_RANGES.map((range) => ({ value: range.key, label: range.label }));
const SEBI_OPTIONS = SEBI_CATEGORIES.map((value) => ({ value, label: SEBI_CATEGORY_LABEL[value] ?? value }));

interface InvestorInfoStepProps {
  defaultValues?: Partial<CreateInvestorInput>;
  onBack: () => void;
  /** The profile is already live: this saves changes to it. */
  isEditing?: boolean;
}

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
}

/**
 * An investor's profile, in BHASKAR's order: what kind of investor (a firm
 * picks its type, an individual is an angel), the firm and your role there,
 * then sectors and stages as taps, the cheque size as a range, and where you
 * are based. The rest (about, thesis, portfolio, SEBI registration) can wait.
 * Sectors are stored as the same industry names startups pick, so matching
 * compares like with like.
 */
export function InvestorInfoStep({ defaultValues, onBack, isEditing = false }: InvestorInfoStepProps) {
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();
  const { isOrganisation } = usePersona();
  const draft = useOnboardingStore((s) => s.draft);
  const city = draftSection<{ city?: string; state?: string }>(draft, "personalDetails");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateInvestorInput>({
    resolver: zodResolver(createInvestorInputSchema),
    defaultValues: {
      preferredIndustries: [],
      preferredStages: [],
      preferredGeography: [],
      portfolioCompanies: [],
      openForPitches: true,
      investorType: isOrganisation ? undefined : "ANGEL",
      checkSizeMinAmount: 0,
      checkSizeMaxAmount: 0,
      location: [city?.city, city?.state].filter(Boolean).join(", ") || undefined,
      ...defaultValues,
    },
  });

  const values = watch();
  useAutosave("investorInfo", 1, values);

  const min = Number(values.checkSizeMinAmount) || 0;
  const max = Number(values.checkSizeMaxAmount) || 0;
  const selectedRange = CHEQUE_SIZE_RANGES.find((range) => range.min === min && range.max === max)?.key;
  const [exact, setExact] = useState(max > 0 && !selectedRange);

  const onSubmit = handleSubmit((data) => {
    // These depend on who signed up, which the shared schema doesn't know.
    let blocked = false;
    if (isOrganisation && !data.firmName) {
      setError("firmName", { message: "Add the firm's name" });
      blocked = true;
    }
    if (isOrganisation && !data.designation) {
      setError("designation", { message: "Add your role at the firm" });
      blocked = true;
    }
    if (!(Number(data.checkSizeMaxAmount) > 0)) {
      setError("checkSizeMaxAmount", { message: "Pick a cheque size" });
      blocked = true;
    } else if (Number(data.checkSizeMinAmount) > Number(data.checkSizeMaxAmount)) {
      setError("checkSizeMinAmount", { message: "The smallest cheque can't be bigger than the largest" });
      blocked = true;
    }
    if (blocked) return;
    // What is on screen goes with the request, so nothing typed a moment ago is left behind.
    publishProfile({ investorInfo: data }, { isEditing, redirectTo: () => "/investor" });
  });

  const customSectors = (values.preferredIndustries ?? []).filter((sector) => !SECTOR_VALUES.has(sector));
  const moreFilled = hasAny([values.bio, values.investmentThesis, values.portfolioCompanies, values.preferredGeography, values.website, values.sebiCategory]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title={isOrganisation ? "Your firm" : "How you invest"}
        minutes={2}
        description="Founders are matched to you on sectors, stage and cheque size, so those come first. A tap each."
      />

      {isOrganisation && (
        <FieldSection title="The firm">
          <Controller
            control={control}
            name="investorType"
            render={({ field }) => (
              <ChoiceChips label="What kind of firm?" required options={FIRM_TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.investorType?.message} />
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Firm name" required autoComplete="organization" error={errors.firmName?.message} {...register("firmName")} />
            <Input
              label="Your role there"
              required
              autoComplete="organization-title"
              placeholder="Partner"
              error={errors.designation?.message}
              {...register("designation")}
            />
          </div>
        </FieldSection>
      )}

      <FieldSection title="What you invest in">
        <ChoiceChips
          label="Sectors"
          required
          multiple
          options={SECTOR_OPTIONS}
          value={values.preferredIndustries}
          onChange={(sector) => setValue("preferredIndustries", toggle(values.preferredIndustries, sector), { shouldValidate: !!errors.preferredIndustries })}
          error={errors.preferredIndustries?.message}
        />
        {customSectors.length > 0 && (
          <TagsInput
            label="Other sectors"
            value={customSectors}
            onChange={(custom) => setValue("preferredIndustries", [...(values.preferredIndustries ?? []).filter((sector) => SECTOR_VALUES.has(sector)), ...custom])}
          />
        )}
        <ChoiceChips
          label="Stages"
          required
          multiple
          options={STAGE_OPTIONS}
          value={values.preferredStages}
          onChange={(stage) => setValue("preferredStages", toggle(values.preferredStages, stage), { shouldValidate: !!errors.preferredStages })}
          error={errors.preferredStages?.message}
        />
      </FieldSection>

      <FieldSection title="Cheque size">
        {!exact ? (
          <ChoiceChips
            label="A typical cheque"
            required
            options={CHEQUE_OPTIONS}
            value={selectedRange}
            onChange={(key) => {
              const range = CHEQUE_SIZE_RANGES.find((item) => item.key === key);
              if (!range) return;
              setValue("checkSizeMinAmount", range.min);
              setValue("checkSizeMaxAmount", range.max, { shouldValidate: !!errors.checkSizeMaxAmount });
            }}
            error={errors.checkSizeMaxAmount?.message}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Smallest cheque (₹)" type="number" inputMode="numeric" min={0} error={errors.checkSizeMinAmount?.message} {...register("checkSizeMinAmount")} />
            <Input label="Largest cheque (₹)" required type="number" inputMode="numeric" min={0} error={errors.checkSizeMaxAmount?.message} {...register("checkSizeMaxAmount")} />
          </div>
        )}
        <button type="button" onClick={() => setExact(!exact)} className="self-start text-sm font-medium text-brand-primary hover:underline">
          {exact ? "Pick a range instead" : "Enter exact amounts instead"}
        </button>
      </FieldSection>

      <Input label="Where you're based" required autoComplete="address-level2" placeholder="Mumbai, Maharashtra" error={errors.location?.message} {...register("location")} />

      <MoreDetails title="More about you as an investor" description="Optional. Founders read these before they send a request." defaultOpen={moreFilled}>
        {!isOrganisation && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Angel fund or network" hint="If you invest through one" error={errors.firmName?.message} {...register("firmName")} />
            <Input label="Your role there" error={errors.designation?.message} {...register("designation")} />
          </div>
        )}
        <Textarea label={isOrganisation ? "About the firm" : "About you"} rows={3} error={errors.bio?.message} {...register("bio")} />
        <Textarea label="Investment thesis" rows={2} placeholder="What you look for in a founder and a market" {...register("investmentThesis")} />
        <Controller
          control={control}
          name="portfolioCompanies"
          render={({ field }) => <TagsInput label="Companies you've backed" value={field.value ?? []} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="preferredGeography"
          render={({ field }) => <TagsInput label="Regions you invest in" hint="For example India, Southeast Asia" value={field.value ?? []} onChange={field.onChange} />}
        />
        <Input label="Website" placeholder="https://…" autoComplete="url" error={errors.website?.message} {...register("website")} />
        <Controller
          control={control}
          name="sebiCategory"
          render={({ field }) => (
            <ChoiceChips
              label="SEBI registration"
              hint="Self-declared. Shown on your profile as you enter it."
              options={SEBI_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.sebiCategory?.message}
            />
          )}
        />
        {values.sebiCategory && values.sebiCategory !== "NOT_REGISTERED" && (
          <Input label="SEBI registration number" placeholder="IN/AIF1/12-13/0001" autoCapitalize="characters" error={errors.sebiRegistrationNumber?.message} {...register("sebiRegistrationNumber")} />
        )}
        <Controller
          control={control}
          name="openForPitches"
          render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} label="I'm open to receiving pitches now" />}
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
