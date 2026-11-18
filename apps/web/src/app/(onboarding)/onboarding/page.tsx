"use client";

import { useCurrentUser, useOnboardingState } from "@vittamhub/api-client";
import { OnboardingStatus, UserRole } from "@vittamhub/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { roleHome } from "@/lib/role-home";

/**
 * The roles whose wizard has to be finished before their dashboard opens.
 * Founders aren't on it: a founder reaches the dashboard straight after
 * signing up and builds the startup profile from there, whenever they like
 * (the dashboard's "Set up your startup profile" card).
 */
const ROLE_ONBOARDING_PATH: Record<string, string> = {
  [UserRole.INVESTOR]: "/onboarding/investor",
  [UserRole.MENTOR]: "/onboarding/mentor",
  [UserRole.INCUBATOR]: "/onboarding/incubator",
  [UserRole.UNIVERSITY]: "/onboarding/university",
};

/** Entry point after login/register — routes to the wizard matching the user's role, or straight to the dashboard. */
export default function OnboardingRedirectPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingState();

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      router.replace("/login");
      return;
    }
    const wizard = ROLE_ONBOARDING_PATH[user.role];
    if (!wizard) {
      router.replace(roleHome(user.role));
      return;
    }
    if (onboardingLoading) return;
    // Every login lands here, so someone who already finished onboarding goes
    // to their dashboard instead of back into the wizard.
    router.replace(onboarding?.status !== OnboardingStatus.COMPLETED ? wizard : roleHome(user.role));
  }, [user, isLoading, isError, onboarding, onboardingLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
    </div>
  );
}
