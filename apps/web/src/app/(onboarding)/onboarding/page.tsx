"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import { UserRole } from "@vittamhub/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROLE_ONBOARDING_PATH: Record<string, string> = {
  [UserRole.FOUNDER]: "/onboarding/founder",
  [UserRole.INVESTOR]: "/onboarding/investor",
  [UserRole.MENTOR]: "/onboarding/mentor",
  [UserRole.INCUBATOR]: "/onboarding/incubator",
  [UserRole.UNIVERSITY]: "/onboarding/university",
  [UserRole.SERVICE_PROVIDER]: "/onboarding/service-provider",
  [UserRole.JOB_SEEKER]: "/onboarding/job-seeker",
};

/** Entry point after login/register — routes to the wizard matching the user's role. */
export default function OnboardingRedirectPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      router.replace("/login");
      return;
    }
    router.replace(ROLE_ONBOARDING_PATH[user.role] ?? "/admin");
  }, [user, isLoading, isError, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
    </div>
  );
}
