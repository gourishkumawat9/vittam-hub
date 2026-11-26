"use client";

import { useCurrentUser, useDocuments } from "@vittamhub/api-client";
import { profileStrength, SIGNUP_SHARE_PERCENT, type ProfileStrength } from "@vittamhub/types";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding-store";

/**
 * The profile strength worked out live from the wizard's answers, so the meter
 * moves as people type. Sign-up alone is worth 20% (see profileStrength in
 * packages/types, which the dashboard card's API answer uses too).
 */
export function useLiveProfileStrength(): ProfileStrength | null {
  const { data: user } = useCurrentUser();
  const { persona } = usePersona();
  const draft = useOnboardingStore((s) => s.draft);
  const { data: documents } = useDocuments();
  return useMemo(
    () =>
      user
        ? profileStrength({
            role: user.role,
            persona,
            email: user.email,
            draft,
            documentTypes: (documents ?? []).map((document) => document.type),
          })
        : null,
    [user, persona, draft, documents],
  );
}

function tone(percent: number) {
  if (percent >= 80) return { label: "Strong", bar: "bg-success-600", text: "text-success-700 dark:text-success-400" };
  if (percent >= 50) return { label: "Getting there", bar: "bg-brand-600", text: "text-brand-700 dark:text-brand-300" };
  return { label: "Just started", bar: "bg-brand-500", text: "text-brand-700 dark:text-brand-300" };
}

/** The number and bar, shared by the wizard's panel and the dashboard card. */
export function StrengthBar({ percent, className }: { percent: number; className?: string }) {
  const style = tone(percent);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-numeric text-3xl font-bold tracking-tight text-text-primary">{percent}%</span>
        <span className={cn("text-xs font-semibold", style.text)}>{style.label}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-background-secondary"
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", style.bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * The wizard's "profile strength" panel: how complete the profile is, and the
 * next questions worth answering. A question opens its step when that step
 * can be opened now (`canOpen`).
 */
export function ProfileStrengthPanel({
  onOpenStep,
  canOpen,
  className,
}: {
  onOpenStep?: (stepId: string) => void;
  canOpen?: (stepId: string) => boolean;
  className?: string;
}) {
  const strength = useLiveProfileStrength();
  if (!strength) return null;

  return (
    <section aria-label="Profile strength" className={cn("flex flex-col gap-4 rounded-card border border-brand-100 bg-gradient-to-b from-brand-50 to-surface p-4 dark:border-white/10 dark:from-white/5", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Profile strength
      </div>
      <StrengthBar percent={strength.percent} />
      <p className="text-xs leading-relaxed text-text-secondary">
        {strength.percent <= SIGNUP_SHARE_PERCENT
          ? `Signing up got you to ${SIGNUP_SHARE_PERCENT}%. Each answer below makes your profile easier to trust and find.`
          : `${strength.answered} of ${strength.total} questions answered.`}
      </p>
      {strength.next.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-text-primary">Answer next</p>
          <ul className="flex flex-col">
            {strength.next.slice(0, 3).map((question) => {
              const open = onOpenStep && (canOpen?.(question.step) ?? true);
              return (
                <li key={question.key}>
                  {open ? (
                    <button
                      type="button"
                      onClick={() => onOpenStep(question.step)}
                      className="flex w-full items-center justify-between gap-2 rounded-button px-2 py-1.5 text-left text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                    >
                      {question.label}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="block px-2 py-1.5 text-xs text-text-secondary">{question.label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

/** A compact pill for the wizard's header on small screens. */
export function ProfileStrengthPill() {
  const strength = useLiveProfileStrength();
  if (!strength) return null;
  return (
    <span className="font-numeric flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-white/10 dark:text-brand-300 lg:hidden">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {strength.percent}% complete
    </span>
  );
}
