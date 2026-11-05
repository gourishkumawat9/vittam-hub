import { NextResponse, type NextRequest } from "next/server";

import { roleHome } from "@/lib/role-home";

/**
 * Edge auth gate. Reads the short-lived session cookie set on login (see
 * docs/09-authentication-security.md) and redirects unauthenticated users
 * away from protected routes, and authenticated users away from /login.
 * Full session validation (signature + expiry) happens in the API; this is
 * a cheap, edge-fast redirect layer, not the source of truth for access control.
 */
const PROTECTED_PREFIXES = ["/founder", "/investor", "/admin"];
const AUTH_ROUTES = ["/login", "/register"];
const REFRESH_COOKIE_NAME = "vh_refresh";

/** Which roles each protected area is for. Admins can open all of them. */
const PREFIX_ROLES: Record<string, string[]> = {
  "/founder": ["FOUNDER", "ADMIN"],
  "/investor": ["INVESTOR", "ADMIN"],
  "/admin": ["ADMIN"],
};

/**
 * Reads `role` and `exp` from the session JWT without verifying it. That's
 * fine here: the result only picks a redirect, and the API still rejects a
 * forged or expired token on every request.
 */
function readSession(token: string | undefined): { role: string } | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { role?: unknown; exp?: unknown };
    if (typeof json.exp === "number" && json.exp * 1000 < Date.now()) return null;
    return typeof json.role === "string" ? { role: json.role } : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request.cookies.get(process.env.SESSION_COOKIE_NAME ?? "vh_session")?.value);
  // The session cookie lives 15 minutes; the refresh cookie up to 30 days.
  // With only the refresh cookie left, let the page load — the API client
  // renews the session on its first 401 instead of sending people to /login.
  const canRefresh = request.cookies.has(REFRESH_COOKIE_NAME);

  const protectedPrefix = PROTECTED_PREFIXES.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (protectedPrefix && !session && !canRefresh) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // A founder opening /investor (or anyone opening /admin) only got a page of
  // permission errors; send them to their own dashboard instead.
  if (protectedPrefix && session && !PREFIX_ROLES[protectedPrefix]?.includes(session.role)) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/founder/:path*", "/investor/:path*", "/admin/:path*", "/login", "/register"],
};
