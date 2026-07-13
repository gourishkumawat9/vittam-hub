import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution — the standard `cn` helper used across @vittamhub/ui. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
