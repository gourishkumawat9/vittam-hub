"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
import {
  DocumentType,
  LookingForType,
  preferencesStepSchema,
  type DocumentUploadInput,
  type FundingStepInput,
  type PreferencesStepInput,
  type VerificationStepInput,
} from "@vittamhub/types";
import { Input } from "@vittamhub/ui";
import { Building, Building2, Check, FileText, GraduationCap, Handshake, Loader2, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { cn } from "@/lib/utils";
import { draftSection, useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { FieldSection, StepHeader } from "../fields";

const OPTIONS: { value: LookingForType; label: string; hint: string; icon: LucideIcon }[] = [
  { value: LookingForType.INVESTORS, label: "Investors", hint: "Angels and funds that back your stage", icon: Handshake },
  { value: LookingForType.MENTORS, label: "Mentors", hint: "Operators who have done it before", icon: GraduationCap },
  { value: LookingForType.INCUBATORS, label: "Incubators", hint: "Space, support and a cohort", icon: Building },
  { value: LookingForType.ACCELERATORS, label: "Accelerators", hint: "A programme with funding attached", icon: Building2 },
];

const RUPEES = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** "5000000" reads as "₹50,00,000 (50 lakh)": Indian founders count in lakh and crore. */
function describeAmount(amount: number): string {
  const formatted = RUPEES.format(amount);
  if (amount >= 1_00_00_000) return `${formatted} (${trim(amount / 1_00_00_000)} crore)`;
  if (amount >= 1_00_000) return `${formatted} (${trim(amount / 1_00_000)} lakh)`;
  return formatted;
}

function trim(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

interface StepProps {
  defaultValues?: Partial<PreferencesStepInput>;
  onNext: () => void;
  onBack: () => void;
}

/**
 * "What you need": who the founder wants to meet, and, for those raising,
 * the amount and the deck. The amount and the deck belong to the Funding and
 * Documents sections, which are optional; they are asked here because they
 * are the two things an investor looks for first.
 */
export function Step9Preferences({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const draft = useOnboardingStore((s) => s.draft);
  const savedFunding = draftSection<FundingStepInput>(draft, "funding") ?? {};
  const savedVerification = draftSection<VerificationStepInput>(draft, "verification") ?? {};

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesStepInput>({
    resolver: zodResolver(preferencesStepSchema),
    defaultValues: { lookingFor: [], ...defaultValues },
  });

  const values = watch();
  useAutosave("preferences", 2, values);

  const [raise, setRaise] = useState<string>(savedFunding.currentRaiseAmount != null ? String(savedFunding.currentRaiseAmount) : "");
  const [deck, setDeck] = useState<DocumentUploadInput | undefined>(() =>
    (savedVerification.documents ?? []).find((doc) => doc.type === DocumentType.PITCH_DECK),
  );
  const [deckUploading, setDeckUploading] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);

  const raiseAmount = raise.trim() === "" ? undefined : Number(raise);
  const raiseInvalid = raiseAmount !== undefined && (!Number.isFinite(raiseAmount) || raiseAmount < 0);

  // Saved into their own sections, keeping whatever else those sections already hold.
  useAutosave("funding", 2, { ...savedFunding, currentRaiseAmount: raiseInvalid ? undefined : raiseAmount });
  useAutosave("verification", 2, {
    ...savedVerification,
    documents: [...(savedVerification.documents ?? []).filter((doc) => doc.type !== DocumentType.PITCH_DECK), ...(deck ? [deck] : [])],
  });

  const lookingFor = values.lookingFor ?? [];
  const raising = lookingFor.includes(LookingForType.INVESTORS) || lookingFor.includes(LookingForType.ACCELERATORS);

  const toggle = (value: LookingForType) => {
    setValue("lookingFor", lookingFor.includes(value) ? lookingFor.filter((v) => v !== value) : [...lookingFor, value], {
      shouldValidate: !!errors.lookingFor,
    });
  };

  const handleDeck = async (file: File | undefined) => {
    if (!file) return;
    setDeckError(null);
    setDeckUploading(true);
    try {
      const fileUrl = await uploadFile(file, "documents");
      setDeck({ type: DocumentType.PITCH_DECK, fileUrl, fileName: file.name });
    } catch (cause) {
      setDeckError(`Your deck couldn't be uploaded. ${cause instanceof Error && cause.message ? cause.message : "Please try again."}`);
    } finally {
      setDeckUploading(false);
    }
  };

  const onSubmit = handleSubmit((data) => {
    if (raiseInvalid) return;
    setSectionData("preferences", data);
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepHeader
        title="What you need"
        minutes={1}
        description="Tell us who you want to meet. Your matches and the people who can find you start from this."
      />

      <FieldSection title="Who are you looking for?" description="Pick all that apply.">
        <div role="group" aria-label="Who are you looking for?" className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const isSelected = lookingFor.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggle(option.value)}
                className={cn(
                  "flex items-start gap-3 rounded-card border p-4 text-left transition-colors duration-200 ease-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                  isSelected ? "border-brand-600 bg-brand-50 dark:bg-white/10" : "border-border hover:border-brand-300 hover:bg-background-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-button",
                    isSelected ? "bg-brand-700 text-white" : "bg-background-secondary text-text-secondary",
                  )}
                >
                  <option.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="title-4">{option.label}</span>
                  <span className="caption-5">{option.hint}</span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    isSelected ? "border-brand-700 bg-brand-700 text-white" : "border-border",
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        {errors.lookingFor?.message && (
          <p className="text-xs text-danger-600" role="alert">
            Pick at least one, so we know who to show you.
          </p>
        )}
      </FieldSection>

      {raising && (
        <FieldSection title="If you are raising" description="Both optional. They are what an investor looks for first.">
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <Input
              label="Raising now (₹)"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="5000000"
              value={raise}
              onChange={(event) => setRaise(event.target.value)}
              hint={raiseAmount && !raiseInvalid ? describeAmount(raiseAmount) : "Leave empty if you would rather discuss it on a call"}
              error={raiseInvalid ? "Enter an amount in rupees, or leave it empty" : undefined}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Pitch deck</span>
              <div className="flex items-center gap-3 rounded-button border border-border px-3 py-2.5">
                <FileText className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{deck ? deck.fileName : "No deck yet"}</span>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-background-secondary focus-within:ring-2 focus-within:ring-brand-primary">
                  {deckUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
                  {deck ? "Replace" : "Upload"}
                  <span className="sr-only">pitch deck</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={deckUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void handleDeck(file);
                    }}
                  />
                </label>
              </div>
              {deckError ? (
                <p className="text-xs text-danger-600" role="alert">
                  {deckError}
                </p>
              ) : (
                <p className="text-xs text-text-secondary">PDF. Kept private, never shown on your public page. It counts toward your Verified badge.</p>
              )}
            </div>
          </div>
        </FieldSection>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={deckUploading} nextLabel="Review" />
    </form>
  );
}
