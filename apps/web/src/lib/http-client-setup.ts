import { configureHttpClient } from "@vittamhub/api-client";

/** Mirrors PROTECTED_PREFIXES in middleware.ts. */
const SIGNED_IN_AREAS = ["/founder", "/investor", "/admin"];

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
    // Middleware lets dashboards load with only the refresh cookie so the
    // session can be renewed; if renewal fails, sign in again instead of
    // showing a dashboard full of errors.
    onSessionExpired: () => {
      const { pathname, search } = window.location;
      if (!SIGNED_IN_AREAS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(pathname + search)}`);
    },
  });
}
