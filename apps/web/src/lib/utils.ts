import { ApiClientError } from "@vittamhub/api-client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution — the standard `cn` helper used across @vittamhub/ui. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True when a query failed because the record doesn't exist yet (e.g. a profile not created during onboarding). */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}
