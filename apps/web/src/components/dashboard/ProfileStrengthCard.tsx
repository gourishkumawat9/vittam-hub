"use client";

import { useCurrentUser, useProfileStrength } from "@vittamhub/api-client";
import { Card, Skeleton } from "@vittamhub/ui";
import { ArrowRight, Gauge } from "@vittamhub/ui/icons";
import Link from "next/link";

import { StrengthBar } from "@/components/onboarding/ProfileStrengthMeter";

import { PanelTitle } from "./PageHeader";

/** Where a question is answered: the role's wizard, opened on that step. */
function questionHref(role: string, step: string) {
  return `/onboarding/${role.toLowerCase()}?step=${step}`;
}

/**
 * How complete the profile is, and the next few questions worth answering,
 * each linking to the step that asks it. Sign-up counts for 20%; the rest of
 * the questions share the other 80% (profileStrength in packages/types).
 */
export function ProfileStrengthCard({ className }: { className?: string }) {
  const { data: user } = useCurrentUser();
  const { data: strength, isLoading } = useProfileStrength();

  if (isLoading || !user) return <Skeleton className="h-56 w-full" />;
  if (!strength) return null;

  return (
    <Card id="profile-strength" className={`flex scroll-mt-20 flex-col gap-4 ${className ?? ""}`}>
      <PanelTitle
        icon={Gauge}
        title="Profile strength"
        right={<span className="text-xs text-text-secondary">{`${strength.answered} of ${strength.total} answered`}</span>}
      />
      <StrengthBar percent={strength.percent} />

      <ul className="grid gap-x-4 gap-y-1 text-xs text-text-secondary sm:grid-cols-2">
        {strength.sections.map((section) => (
          <li key={section.key} className="flex items-center justify-between gap-2">
            <span>{section.title}</span>
            <span className="font-numeric font-medium text-text-primary">
              {section.answered}/{section.total}
            </span>
          </li>
        ))}
      </ul>

      {strength.next.length > 0 ? (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <p className="text-xs font-semibold text-text-primary">Answer next</p>
          <ul className="flex flex-col">
            {strength.next.map((question) => (
              <li key={question.key}>
                <Link
                  href={questionHref(user.role, question.step)}
                  className="flex w-full items-center justify-between gap-3 rounded-button px-2 py-1.5 text-left text-xs text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
                >
                  {question.label}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-success-600">Every question is answered. Your profile is complete.</p>
      )}
    </Card>
  );
}
