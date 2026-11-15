import { useOnboardingStore } from "@/store/onboarding-store";

/**
 * The last step of signing out or deleting an account: forget what this tab
 * holds and load the next page from scratch.
 *
 * A full page load, not a client-side navigation, on purpose. Everything
 * the app has fetched lives in memory for the tab; moving to /login without
 * a reload kept it there, so the next person to sign in on the same computer
 * could be shown the previous person's data.
 */
export function leaveSession(to = "/login") {
  useOnboardingStore.getState().reset();
  window.location.assign(to);
}
