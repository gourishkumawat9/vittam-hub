/**
 * Where each role lands once signed in — mirrors the first entry of its
 * sidebar nav. Plain strings (not the UserRole import) so middleware.ts can
 * use it at the edge without pulling in the types package.
 */
export const ROLE_HOME: Record<string, string> = {
  FOUNDER: "/founder",
  INVESTOR: "/investor",
  ADMIN: "/admin",
  MENTOR: "/mentors/bookings",
  JOB_SEEKER: "/jobs",
};

export function roleHome(role: string): string {
  return ROLE_HOME[role] ?? "/community";
}
