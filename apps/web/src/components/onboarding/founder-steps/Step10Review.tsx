"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DocumentType,
  personalDetailsInputSchema,
  publishStartupInputSchema,
  startupInfoStepSchema,
  type DocumentUploadInput,
  type PublishStartupInput,
  type StartupWizardStep,
} from "@vittamhub/types";
import { Checkbox, Input } from "@vittamhub/ui";
import { AlertCircle, Check, MapPin, Pencil, Plus } from "@vittamhub/ui/icons";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { usePublishProfile } from "@/hooks/usePublishProfile";
import {
  FUNDING_STATUS_LABEL,
  INDUSTRY_LABEL,
  labelFor,
  LOOKING_FOR_LABEL,
  PRODUCT_STATUS_LABEL,
  REGISTRATION_LABEL,
  REVENUE_STATUS_LABEL,
  STAGE_LABEL,
} from "@/lib/startup-options";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import type { WizardStepMeta } from "../WizardShell";
import { StepHeader } from "../fields";

/** The terms are agreed to once, when the profile first goes live. Saving an edit asks for nothing more. */
const editConfirmationSchema = z.object({
  acceptedTerms: z.boolean().optional(),
  signatureFullName: z.string().optional(),
});

/** Why each optional section is worth adding, in one line. */
const OPTIONAL_WHY: Record<string, string> = {
  product: "Links, screenshots and what you have built",
  traction: "Users, customers and revenue, once you have them",
  team: "Cofounders and the people building with you",
  funding: "What you have raised and on what terms",
  market: "Who you serve and how big the market is",
  verification: "Incorporation, DPIIT and the rest, for your Verified badge",
};

const RUPEES = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Section = Record<string, unknown>;

interface Row {
  label: string;
  value: string;
}

function rows(entries: [string, unknown][]): Row[] {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0))
    .map(([label, value]) => ({ label, value: String(value) }));
}

/** The first problem a schema finds in a section, worded for the founder, or null when it is ready. */
function firstIssue(schema: z.ZodTypeAny, value: unknown): string | null {
  const result = schema.safeParse(value ?? {});
  if (result.success) return null;
  const issue = result.error.issues[0];
  return issue?.message && issue.message !== "Required" ? issue.message : "A required answer is missing";
}

interface StepProps {
  onBack: () => void;
  /** The startup is already live: this saves changes to it. */
  isEditing?: boolean;
  goToStep: (id: StartupWizardStep) => void;
  optionalSteps: WizardStepMeta[];
}

export function Step10Review({ onBack, isEditing = false, goToStep, optionalSteps }: StepProps) {
  const { draft } = useOnboardingStore();
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<PublishStartupInput>>({
    resolver: zodResolver(isEditing ? editConfirmationSchema : publishStartupInputSchema),
    defaultValues: { acceptedTerms: undefined, signatureFullName: "" },
  });

  const onSubmit = handleSubmit((confirmation) =>
    // The answers reviewed on this page are the ones that get published.
    publishProfile(isEditing ? { ...draft } : { ...draft, ...confirmation }, { isEditing, redirectTo: () => "/founder" }),
  );

  const you = (draft.personalDetails as Section | undefined) ?? {};
  const startup = (draft.startupInfo as Section | undefined) ?? {};
  const needs = (draft.preferences as Section | undefined) ?? {};
  const funding = (draft.funding as Section | undefined) ?? {};
  const documents = ((draft.verification as Section | undefined)?.documents as DocumentUploadInput[] | undefined) ?? [];
  const deck = documents.find((doc) => doc.type === DocumentType.PITCH_DECK);
  const lookingFor = ((needs.lookingFor as string[] | undefined) ?? []).map((value) => labelFor(LOOKING_FOR_LABEL, value));

  const youIssue = firstIssue(personalDetailsInputSchema, draft.personalDetails);
  const startupIssue = firstIssue(startupInfoStepSchema, draft.startupInfo);
  const needsIssue = lookingFor.length === 0 ? "Pick who you are looking for" : null;
  const readyToPublish = !youIssue && !startupIssue;

  const name = (startup.name as string | undefined) || "Your startup";
  const initials = name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title={isEditing ? "Review and save" : "Review and publish"}
        description={
          isEditing
            ? "Check your changes, then save them. Your profile page updates straight away."
            : "This is how your startup will look. Publish now and add the rest whenever you like."
        }
      />

      {/* A preview of the card investors and mentors see in the directory. */}
      <section aria-labelledby="preview-heading" className="flex flex-col gap-3">
        <h3 id="preview-heading" className="title-4 text-text-secondary">
          How your startup appears
        </h3>
        <div className="flex flex-col gap-4 rounded-card border border-border bg-background-secondary p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-surface text-base font-semibold text-brand-700">
              {startup.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL
                <img src={startup.logoUrl as string} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="heading-6 truncate">{name}</p>
              <p className="body-5 text-text-secondary">{(startup.tagline as string | undefined) || "Your one line pitch shows here."}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!!startup.stage && <Chip>{labelFor(STAGE_LABEL, startup.stage as string)}</Chip>}
            {!!startup.industry && <Chip>{labelFor(INDUSTRY_LABEL, startup.industry as string)}</Chip>}
            {!!startup.headquarters && (
              <Chip>
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {startup.headquarters as string}
              </Chip>
            )}
            {!!startup.foundedYear && <Chip>Since {String(startup.foundedYear)}</Chip>}
          </div>
          {lookingFor.length > 0 && <p className="caption-5">Looking for {lookingFor.join(", ")}</p>}
        </div>
      </section>

      <section aria-labelledby="essentials-heading" className="flex flex-col gap-3">
        <h3 id="essentials-heading" className="title-4 text-text-secondary">
          The essentials
        </h3>
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          <SummaryBlock
            title="About you"
            issue={youIssue}
            onEdit={() => goToStep("personal-details")}
            rows={rows([
              ["Name", you.fullName],
              ["Mobile", you.mobileNumber],
              ["City", you.city],
              ["LinkedIn", you.linkedinUrl],
              ["About", you.bio],
            ])}
          />
          <SummaryBlock
            title="Your startup"
            issue={startupIssue}
            onEdit={() => goToStep("startup-info")}
            rows={rows([
              ["What you do", startup.description],
              ["Product", labelFor(PRODUCT_STATUS_LABEL, startup.productStatus as string)],
              ["Revenue", labelFor(REVENUE_STATUS_LABEL, startup.revenueStatus as string)],
              ["Funding so far", labelFor(FUNDING_STATUS_LABEL, startup.fundingStatus as string)],
              ["Registered", labelFor(REGISTRATION_LABEL, startup.registrationStatus as string)],
              ["Website", startup.website],
            ])}
          />
          <SummaryBlock
            title="What you need"
            issue={needsIssue}
            onEdit={() => goToStep("preferences")}
            rows={rows([
              ["Looking for", lookingFor.join(", ")],
              ["Raising now", typeof funding.currentRaiseAmount === "number" ? RUPEES.format(funding.currentRaiseAmount) : undefined],
              ["Pitch deck", deck?.fileName],
            ])}
          />
        </div>
      </section>

      <section aria-labelledby="stronger-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 id="stronger-heading" className="title-4 text-text-secondary">
            Make it stronger, now or later
          </h3>
          <p className="caption-5">All optional. Investors see more of your story, and none of it holds up publishing.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {optionalSteps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => goToStep(step.id as StartupWizardStep)}
                className="flex h-full w-full items-start gap-3 rounded-card border border-border p-4 text-left transition-colors duration-200 ease-base hover:border-brand-300 hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    step.done ? "border-success-600 bg-success-600 text-white" : "border-border text-text-secondary",
                  )}
                >
                  {step.done ? <Check className="h-3 w-3" aria-hidden="true" /> : <Plus className="h-3 w-3" aria-hidden="true" />}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="title-4">
                    {step.label}
                    <span className="sr-only">{step.done ? ", added" : ", not added yet"}</span>
                  </span>
                  <span className="caption-5">{OPTIONAL_WHY[step.id]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {!isEditing && (
        <div className="flex flex-col gap-4 rounded-card border border-border p-5">
          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field }) => (
              <Checkbox
                checked={field.value === true}
                onCheckedChange={field.onChange}
                label={
                  <>
                    The information above is accurate, and I accept the{" "}
                    <a href="/terms" target="_blank" rel="noopener" className="font-medium text-brand-700 underline underline-offset-2">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" rel="noopener" className="font-medium text-brand-700 underline underline-offset-2">
                      Privacy Policy
                    </a>
                  </>
                }
                error={errors.acceptedTerms?.message}
              />
            )}
          />
          <Input
            label="Type your full legal name to sign"
            autoComplete="name"
            error={errors.signatureFullName?.message}
            {...register("signatureFullName")}
          />
        </div>
      )}

      {!readyToPublish && (
        <p role="status" className="flex items-start gap-2 rounded-button bg-warning-50 px-3 py-2.5 text-sm text-text-primary">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
          Finish the essentials marked above, then publish.
        </p>
      )}

      {publishError && (
        <p role="alert" className="rounded-button border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {publishError}
        </p>
      )}

      <WizardNav
        onBack={onBack}
        onNext={onSubmit}
        isSubmitting={isPublishing}
        nextLabel={isEditing ? "Save changes" : "Publish startup profile"}
      />
    </form>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-primary">
      {children}
    </span>
  );
}

function SummaryBlock({ title, rows: items, issue, onEdit }: { title: string; rows: Row[]; issue: string | null; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="title-4 flex items-center gap-2">
          {issue ? (
            <AlertCircle className="h-4 w-4 text-warning-600" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-success-600" aria-hidden="true" />
          )}
          {title}
        </h4>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-button px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-white/10"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
          <span className="sr-only">{title}</span>
        </button>
      </div>
      {issue && <p className="text-xs font-medium text-warning-700">{issue}</p>}
      {items.length > 0 && (
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[max-content_1fr]">
          {items.map((row) => (
            <div key={row.label} className="contents">
              <dt className="caption-5">{row.label}</dt>
              <dd className="body-6 mb-1 break-words text-text-primary sm:mb-0">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
