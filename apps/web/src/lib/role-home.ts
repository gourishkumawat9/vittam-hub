/**
 * Where each role lands once signed in — mirrors the first entry of its
 * sidebar nav. Plain strings (not the UserRole import) so middleware.ts can
 * use it at the edge without pulling in the types package.
 */
export const ROLE_HOME: Record<string, string> = {
  FOUNDER: "/founder",
  INVESTOR: "/investor",
  ADMIN: "/admin",
  // Mentors, incubators and universities share one Home page that adapts to the role.
  MENTOR: "/home",
  INCUBATOR: "/home",
  UNIVERSITY: "/home",
};

export function roleHome(role: string): string {
  return ROLE_HOME[role] ?? "/community";
}

/**
 * Where each role changes what its public profile says. For everyone but
 * investors that is the sign-up wizard, which reopens with the saved answers.
 */
const EDIT_PROFILE: Record<string, { href: string; label: string }> = {
  FOUNDER: { href: "/onboarding/founder", label: "Edit startup profile" },
  INVESTOR: { href: "/investor/profile", label: "Edit investor profile" },
  MENTOR: { href: "/onboarding/mentor", label: "Edit mentor profile" },
  INCUBATOR: { href: "/onboarding/incubator", label: "Edit incubator profile" },
  UNIVERSITY: { href: "/onboarding/university", label: "Edit university profile" },
};

export function editProfileLink(role: string): { href: string; label: string } | null {
  return EDIT_PROFILE[role] ?? null;
}

/**
 * Every part of the site that needs a signed-in account. One list, read by
 * the edge middleware (which redirects a signed-out visitor to /login) and by
 * the API client (which does the same when a session can't be renewed).
 * Before, only the founder, investor and admin dashboards were on it, so a
 * signed-out visitor to /community or /mentors got an empty page of errors.
 */
export const SIGNED_IN_AREAS = [
  "/home",
  "/founder",
  "/investor",
  "/admin",
  "/onboarding",
  "/community",
  "/connections",
  "/mentors",
  "/incubators",
  "/universities",
  "/search",
  "/settings",
] as const;

export function isSignedInArea(pathname: string): boolean {
  return SIGNED_IN_AREAS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
