import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge auth gate. Reads the short-lived session cookie set on login (see
 * docs/09-authentication-security.md) and redirects unauthenticated users
 * away from protected routes, and authenticated users away from /login.
 * Full session validation (signature + expiry) happens in the API; this is
 * a cheap, edge-fast redirect layer, not the source of truth for access control.
 */
const PROTECTED_PREFIXES = ["/founder", "/investor", "/admin"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(process.env.SESSION_COOKIE_NAME ?? "vh_session");

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/founder", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/founder/:path*", "/investor/:path*", "/admin/:path*", "/login", "/register"],
};
