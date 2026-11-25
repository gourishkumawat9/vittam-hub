"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface WizardNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  isFirstStep?: boolean;
  isSubmitting?: boolean;
}

export function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  isFirstStep = false,
  isSubmitting = false,
}: WizardNavProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep}
        className="-ml-4 inline-flex items-center gap-1.5 rounded-button px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background-secondary disabled:pointer-events-none disabled:opacity-0"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="inline-flex items-center gap-1.5 rounded-button bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-base hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {nextLabel}
        {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
