"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { publishStartupInputSchema, STARTUP_WIZARD_STEPS, type PublishStartupInput } from "@vittamhub/types";
import { Checkbox, Input } from "@vittamhub/ui";
import { Pencil } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { usePublishProfile } from "@/hooks/usePublishProfile";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

interface SummaryRow {
  label: string;
  value: string;
}

function summarize(section: Record<string, unknown>): SummaryRow[] {
  return Object.entries(section)
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      value: formatValue(value),
    }));
}

/** "PRE_REVENUE" is how a choice is stored; "Pre revenue" is how it reads. */
function readable(value: unknown): string {
  const text = String(value);
  return /^[A-Z][A-Z0-9_]*$/.test(text) && text.length > 1 ? text.charAt(0) + text.slice(1).toLowerCase().replace(/_/g, " ") : text;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "object" && item !== null ? Object.values(item).filter(Boolean).map(readable).join(", ") : readable(item)))
      .join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return readable(value);
}

const SECTION_LABELS: Record<string, string> = {
  personalDetails: "Founder information",
  startupInfo: "Startup information",
  product: "Product details",
  market: "Market details",
  team: "Team details",
  traction: "Traction",
  funding: "Funding",
  verification: "Verification documents",
  preferences: "Preferences",
};

const SECTION_STEP_INDEX: Record<string, number> = {
  personalDetails: 0,
  startupInfo: 1,
  product: 2,
  market: 3,
  team: 4,
  traction: 5,
  funding: 6,
  verification: 7,
  preferences: 8,
};

interface StepProps {
  onBack: () => void;
  /** The startup is already live: this saves changes to it. */
  isEditing?: boolean;
}

export function Step10Review({ onBack, isEditing = false }: StepProps) {
  const { draft, setStep } = useOnboardingStore();
  const { publishProfile, isPublishing, error: publishError } = usePublishProfile();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PublishStartupInput>({
    resolver: zodResolver(publishStartupInputSchema),
    defaultValues: { acceptedTerms: undefined, signatureFullName: "" },
  });

  const onSubmit = handleSubmit((confirmation) =>
    // The answers reviewed on this page are the ones that get published.
    publishProfile({ ...draft, ...confirmation }, { isEditing, redirectTo: () => "/founder" }),
  );

  const sections = STARTUP_WIZARD_STEPS.filter((id) => id !== "review" && id !== "personal-details").map((id) => {
    const key = toSectionKey(id);
    return { key, label: SECTION_LABELS[key]!, rows: summarize((draft[key] as Record<string, unknown>) ?? {}) };
  });
  const personalDetails = summarize((draft.personalDetails as Record<string, unknown>) ?? {});

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">{isEditing ? "Review & save" : "Review & publish"}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditing
            ? "Check your changes below, then save them. Your profile page updates straight away."
            : "Check everything below, then publish your startup profile. You can change any of it later."}
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-card border border-border">
        <SummarySection title={SECTION_LABELS.personalDetails!} rows={personalDetails} onEdit={() => setStep(0)} />
        {sections.map((section) => (
          <SummarySection
            key={section.key}
            title={section.label}
            rows={section.rows}
            onEdit={() => setStep(SECTION_STEP_INDEX[section.key]!)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-background-secondary p-4">
        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value === true}
              onCheckedChange={field.onChange}
              label="I confirm the information above is accurate and I accept the Terms of Service and Privacy Policy"
              error={errors.acceptedTerms?.message}
            />
          )}
        />
        <Input
          label="Type your full legal name to sign"
          error={errors.signatureFullName?.message}
          {...register("signatureFullName")}
        />
      </div>

      {publishError && (
        <p role="alert" className="rounded-button border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {publishError}
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={isPublishing} nextLabel={isEditing ? "Save changes" : "Publish startup profile"} />
    </form>
  );
}

function toSectionKey(stepId: string): string {
  return stepId.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function SummarySection({ title, rows, onEdit }: { title: string; rows: SummaryRow[]; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-brand-primary">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-text-secondary">Not filled in yet.</p>
      ) : (
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-2 text-xs">
              <dt className="shrink-0 text-text-secondary">{row.label}</dt>
              <dd className="truncate text-right font-medium text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
