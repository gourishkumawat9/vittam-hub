/**
 * Dashboard preview mode: every dashboard opens without signing in, filled
 * with demo data, so the owner can review the UI.
 *
 * It only ever switches on for a Vercel *preview* build that sets
 * NEXT_PUBLIC_DASHBOARD_PREVIEW=1. A production build, and anything served on
 * vittamhub.com, ignores the flag. In preview mode the app never talks to the
 * real API: requests are answered in the browser from lib/preview/fixtures.ts.
 *
 * To remove it: delete src/lib/preview, src/components/preview and
 * src/app/preview, and the lines marked "dashboard preview" in middleware.ts,
 * lib/http-client-setup.ts and app/providers.tsx.
 */

const LIVE_HOSTS = ["vittamhub.com", "www.vittamhub.com"];

/** Build-time check (also safe at the edge, where there is no window). */
export function previewFlagSet(): boolean {
  return process.env.NEXT_PUBLIC_DASHBOARD_PREVIEW === "1" && process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";
}

export function isLiveHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.split(":")[0]!.toLowerCase();
  return LIVE_HOSTS.includes(bare);
}

/** True in the browser when this page is a dashboard preview. */
export function isPreviewMode(): boolean {
  if (!previewFlagSet()) return false;
  if (typeof window === "undefined") return true;
  return !isLiveHost(window.location.host);
}

/** A base URL that can never reach a real server; every request to it is answered by the preview handler. */
export const PREVIEW_API_BASE = "https://preview-api.invalid";

export const PREVIEW_ROLES = ["founder", "investor", "admin", "mentor", "incubator", "university"] as const;
export type PreviewRole = (typeof PREVIEW_ROLES)[number];

const ROLE_STORAGE_KEY = "vh_preview_role";

function isPreviewRole(value: string | null | undefined): value is PreviewRole {
  return !!value && (PREVIEW_ROLES as readonly string[]).includes(value);
}

function readStoredRole(): PreviewRole | null {
  try {
    const value = window.sessionStorage.getItem(ROLE_STORAGE_KEY);
    return isPreviewRole(value) ? value : null;
  } catch {
    return null;
  }
}

function storeRole(role: PreviewRole) {
  try {
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // Private mode: the role then comes from the URL each time.
  }
}

/**
 * Which demo account the preview is showing. `?as=investor` on any link picks
 * one; the founder, investor and admin areas pick their own; otherwise the
 * last one picked in this tab, founder to start with.
 */
export function currentPreviewRole(): PreviewRole {
  if (typeof window === "undefined") return "founder";
  const { pathname, search } = window.location;
  const asParam = new URLSearchParams(search).get("as");
  let role: PreviewRole | null = isPreviewRole(asParam) ? asParam : null;
  if (!role) {
    if (pathname === "/founder" || pathname.startsWith("/founder/")) role = "founder";
    else if (pathname === "/investor" || pathname.startsWith("/investor/")) role = "investor";
    else if (pathname === "/admin" || pathname.startsWith("/admin/")) role = "admin";
    else if (pathname.startsWith("/onboarding/")) {
      const fromPath = pathname.split("/")[2];
      if (isPreviewRole(fromPath)) role = fromPath;
    }
  }
  role ??= readStoredRole() ?? "founder";
  storeRole(role);
  return role;
}
