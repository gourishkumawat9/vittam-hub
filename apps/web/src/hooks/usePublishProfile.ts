"use client";

import { ApiClientError, usePublishOnboarding } from "@vittamhub/api-client";
import { useToast } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOnboardingStore } from "@/store/onboarding-store";

/** The API's own words when it explains what to fix ("Check: website."), and a plain line when it can't. */
function reasonFor(error: unknown): string {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500 && error.status !== 401 && error.apiError.message) {
    return error.apiError.message;
  }
  return "We couldn't save your profile just now. Nothing was lost. Please try again in a moment.";
}

/**
 * The last action of every wizard: publish the profile, or save the changes
 * to one that is already live.
 *
 * `sections` are the answers on screen right now. They go with the request
 * because autosave is debounced: pressing the button straight after typing
 * used to publish what the server had from a moment earlier.
 */
export function usePublishProfile() {
  const router = useRouter();
  const publish = usePublishOnboarding();
  const reset = useOnboardingStore((s) => s.reset);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const publishProfile = async (
    sections: Record<string, unknown>,
    options: { isEditing: boolean; redirectTo: (profile: { id: string }) => string },
  ) => {
    setError(null);
    let profile: { id: string };
    try {
      profile = await publish.mutateAsync(sections);
    } catch (err) {
      setError(reasonFor(err));
      return;
    }
    toast({
      variant: "success",
      title: options.isEditing ? "Your changes are saved" : "Your profile is live",
      description: options.isEditing ? undefined : "You can change anything on it later from Edit profile.",
    });
    router.push(options.redirectTo(profile));
    // Cleared after the navigation is under way, so the step doesn't flash empty first.
    reset();
  };

  return { publishProfile, isPublishing: publish.isPending, error };
}
