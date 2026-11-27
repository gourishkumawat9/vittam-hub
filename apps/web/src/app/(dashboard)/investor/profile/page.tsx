"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser, useMyInvestorProfile, useUpdateMyInvestorProfile, type InvestorWithOwner } from "@vittamhub/api-client";
import { Industry, InvestorType, SEBI_CATEGORIES, updateInvestorInputSchema, type StartupStage, type UpdateInvestorInput } from "@vittamhub/types";
import { Button, Card, Checkbox, EmptyState, ErrorState, Input, Skeleton, TagsInput, Textarea, useToast } from "@vittamhub/ui";
import { Eye, ShieldCheck, UserRound } from "@vittamhub/ui/icons";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { InvestorCard } from "@/components/dashboard/founder/InvestorCard";
import { ChoiceChips } from "@/components/onboarding/fields";
import { INVESTOR_TYPE_LABEL, SEBI_CATEGORY_LABEL } from "@/lib/signup-options";
import { INDUSTRY_LABEL, optionsFrom, STAGE_LABEL } from "@/lib/startup-options";
import { isNotFoundError } from "@/lib/utils";

const TYPE_OPTIONS = Object.values(InvestorType).map((value) => ({ value, label: INVESTOR_TYPE_LABEL[value] ?? value }));
const SECTOR_OPTIONS = optionsFrom(INDUSTRY_LABEL);
const SECTOR_VALUES = new Set<string>(Object.values(Industry));
const STAGE_OPTIONS = optionsFrom<StartupStage>(STAGE_LABEL);
const SEBI_OPTIONS = SEBI_CATEGORIES.map((value) => ({ value, label: SEBI_CATEGORY_LABEL[value] ?? value }));

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
}

/** One titled block of the form. */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="title-2">{title}</h2>
        {description && <p className="caption-5">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

/**
 * The investor's own profile, edited in place: what founders read before they
 * send a connect request, with a live preview of the card they see.
 */
export default function InvestorProfilePage() {
  const { data: investor, isLoading, isError, error } = useMyInvestorProfile();
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateMyInvestorProfile();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateInvestorInput>({ resolver: zodResolver(updateInvestorInputSchema) });

  useEffect(() => {
    if (investor) {
      reset({
        firmName: investor.firmName ?? undefined,
        designation: investor.designation ?? undefined,
        investorType: investor.investorType,
        website: investor.website ?? undefined,
        bio: investor.bio,
        preferredIndustries: investor.preferredIndustries,
        preferredStages: investor.preferredStages,
        checkSizeMinAmount: investor.checkSizeMinAmount,
        checkSizeMaxAmount: investor.checkSizeMaxAmount,
        preferredGeography: investor.preferredGeography,
        location: investor.location,
        portfolioCompanies: investor.portfolioCompanies,
        investmentThesis: investor.investmentThesis ?? undefined,
        openForPitches: investor.openForPitches,
        sebiCategory: investor.sebiCategory ?? undefined,
        sebiRegistrationNumber: investor.sebiRegistrationNumber ?? undefined,
      });
    }
  }, [investor, reset]);

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    await updateProfile.mutateAsync(data);
    toast({ variant: "success", title: "Profile saved", description: "Founders see the changes straight away." });
  });

  const header = (
    <PageHeader
      title="Investor profile"
      description="What founders read before they send you a connect request. Sectors, stages and cheque size also decide which startups are suggested to you."
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }
  // No investor profile until onboarding is finished: the API answers 404.
  if (isNotFoundError(error)) {
    return (
      <EmptyState
        className="mx-auto max-w-2xl"
        icon={UserRound}
        title="Set up your investor profile"
        description="Finish onboarding to create the profile founders see when they find you."
        action={
          <Button asChild size="sm">
            <Link href="/onboarding/investor">Finish onboarding</Link>
          </Button>
        }
      />
    );
  }
  if (isError || !investor) return <ErrorState className="mx-auto max-w-2xl" />;

  const customSectors = (values.preferredIndustries ?? []).filter((sector) => !SECTOR_VALUES.has(sector));
  // The card founders see, built from what's on screen so the preview follows each edit.
  const preview: InvestorWithOwner = {
    ...investor,
    firmName: values.firmName || null,
    bio: values.bio ?? "",
    preferredIndustries: values.preferredIndustries ?? [],
    checkSizeMinAmount: Number(values.checkSizeMinAmount ?? 0),
    checkSizeMaxAmount: Number(values.checkSizeMaxAmount ?? 0),
    openForPitches: values.openForPitches ?? investor.openForPitches,
    owner: { fullName: user?.fullName ?? "You", avatarUrl: user?.avatarUrl ?? null },
    metrics: investor.metrics ?? null,
    trust: investor.trust ?? null,
  };

  return (
    <div className="flex flex-col gap-6">
      {header}

      <form onSubmit={onSubmit} className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="title-2">Open to pitches</h2>
              <p className="caption-5">When this is off, founders can still find you but can&apos;t send a connect request.</p>
            </div>
            <Controller
              control={control}
              name="openForPitches"
              render={({ field }) => <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} label={field.value ? "Open" : "Not now"} />}
            />
          </Card>

          <Section title="Who you are">
            <Controller
              control={control}
              name="investorType"
              render={({ field }) => (
                <ChoiceChips label="Kind of investor" options={TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.investorType?.message} />
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Firm, fund or network" hint="Leave empty if you invest on your own" error={errors.firmName?.message} {...register("firmName")} />
              <Input label="Your role there" placeholder="Partner" error={errors.designation?.message} {...register("designation")} />
              <Input label="Where you're based" placeholder="Mumbai, Maharashtra" error={errors.location?.message} {...register("location")} />
              <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
            </div>
          </Section>

          <Section title="What you invest in" description="Startups are matched to you on these, and founders filter by them.">
            <ChoiceChips
              label="Sectors"
              multiple
              options={SECTOR_OPTIONS}
              value={values.preferredIndustries}
              onChange={(sector) => setValue("preferredIndustries", toggle(values.preferredIndustries, sector), { shouldDirty: true })}
              error={errors.preferredIndustries?.message}
            />
            {customSectors.length > 0 && (
              <TagsInput
                label="Other sectors"
                value={customSectors}
                onChange={(custom) =>
                  setValue("preferredIndustries", [...(values.preferredIndustries ?? []).filter((sector) => SECTOR_VALUES.has(sector)), ...custom], { shouldDirty: true })
                }
              />
            )}
            <ChoiceChips
              label="Stages"
              multiple
              options={STAGE_OPTIONS}
              value={values.preferredStages}
              onChange={(stage) => setValue("preferredStages", toggle(values.preferredStages, stage), { shouldDirty: true })}
              error={errors.preferredStages?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Smallest cheque (₹)" type="number" inputMode="numeric" min={0} error={errors.checkSizeMinAmount?.message} {...register("checkSizeMinAmount")} />
              <Input label="Largest cheque (₹)" type="number" inputMode="numeric" min={0} error={errors.checkSizeMaxAmount?.message} {...register("checkSizeMaxAmount")} />
            </div>
            <Controller
              control={control}
              name="preferredGeography"
              render={({ field }) => <TagsInput label="Regions you invest in" hint="For example India, Southeast Asia" value={field.value ?? []} onChange={field.onChange} />}
            />
          </Section>

          <Section title="About you" description="Optional, but founders read these before they write to you.">
            <Textarea label="About" rows={4} error={errors.bio?.message} {...register("bio")} />
            <Textarea label="Investment thesis" rows={3} placeholder="What you look for in a founder and a market" {...register("investmentThesis")} />
            <Controller
              control={control}
              name="portfolioCompanies"
              render={({ field }) => <TagsInput label="Companies you've backed" value={field.value ?? []} onChange={field.onChange} />}
            />
          </Section>

          <Section title="SEBI registration" description="Self-declared, and shown on your profile as you enter it.">
            <Controller
              control={control}
              name="sebiCategory"
              render={({ field }) => (
                <ChoiceChips label="Registration" options={SEBI_OPTIONS} value={field.value ?? undefined} onChange={field.onChange} error={errors.sebiCategory?.message} />
              )}
            />
            {values.sebiCategory && values.sebiCategory !== "NOT_REGISTERED" && (
              <Input
                label="SEBI registration number"
                placeholder="IN/AIF1/12-13/0001"
                autoCapitalize="characters"
                error={errors.sebiRegistrationNumber?.message}
                {...register("sebiRegistrationNumber")}
              />
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Preview and save">
          <PanelTitle icon={Eye} title="How founders see you" />
          <InvestorCard investor={preview} preview />
          <Card className="flex flex-col gap-3">
            <Button type="submit" isLoading={updateProfile.isPending} disabled={!isDirty}>
              Save changes
            </Button>
            {isDirty ? (
              <button type="button" onClick={() => reset()} className="text-sm font-medium text-text-secondary hover:text-text-primary">
                Discard changes
              </button>
            ) : (
              <p className="caption-5 text-center">No unsaved changes</p>
            )}
          </Card>
          <Link
            href="/settings#verification"
            className="flex items-center gap-2 rounded-card border border-border px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
            See what your Verified badge still needs
          </Link>
        </aside>
      </form>
    </div>
  );
}
