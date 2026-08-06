import { configureHttpClient } from "@vittamhub/api-client";

/** Reads a single cookie's value by name — browser-only, mirrors what the API's csrf_token cookie is set up to be read by. */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];
  return value !== undefined ? decodeURIComponent(value) : undefined;
}

/**
 * Wires the double-submit CSRF cookie into every mutating API request —
 * see docs/09-authentication-security.md §CSRF. Call once at app startup.
 */
export function setupHttpClient() {
  configureHttpClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    getCsrfToken: () => readCookie("csrf_token"),
  });
}
