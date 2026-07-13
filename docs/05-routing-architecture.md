# 05 — Routing Architecture

## Next.js App Router, route groups by audience

```
app/(marketing)/     public, unauthenticated
app/(auth)/          login/register/forgot-password, chrome-free
app/(dashboard)/     authenticated, role-scoped (founder/investor/admin)
```

Route groups (`(marketing)`, `(auth)`, `(dashboard)`) don't affect the URL — `(dashboard)/founder/page.tsx` serves `/founder`, not `/dashboard/founder`. They exist purely to give each audience its own `layout.tsx` (nav+footer / bare card / sidebar+topbar) without one layout file branching on "am I logged in, what role" via conditionals.

## Two-layer access control — never rely on either alone

**Layer 1 — Edge middleware (`apps/web/src/middleware.ts`)**: reads the session cookie's *presence* and redirects. This is a UX optimization (instant redirect before any page code runs, works at the CDN edge) — it is deliberately cheap and does **not** validate the JWT's signature or expiry, only that a cookie exists. `PROTECTED_PREFIXES` (`/founder`, `/investor`, `/admin`) redirect to `/login?redirectTo=...` when the cookie is absent; `AUTH_ROUTES` (`/login`, `/register`) redirect away when it's present.

**Layer 2 — The API is the actual authority.** Every request that matters hits `apps/api`, where `JwtAuthGuard` (global, `APP_GUARD` in `app.module.ts`) verifies the signature and expiry of the token read from the cookie, and `RolesGuard` checks `@Roles(...)` metadata against the verified payload. A page rendering under `/admin` because middleware saw *a* cookie is not the same as being allowed to call `PATCH /v1/admin/startups/:id/verification` — that call re-checks role server-side regardless of what the middleware let through. **Never add a check only in middleware or only in a page component and call it done** — the API guard is the one that can't be bypassed by hitting the endpoint directly.

## Role-based navigation, not role-based layouts

`(dashboard)/layout.tsx` is a single implementation shared by founder/investor/admin. The `Sidebar` component (not yet built — see [03-component-library.md](./03-component-library.md)) reads the session role and renders the right nav items; there is no `FounderLayout` / `InvestorLayout` / `AdminLayout` fork. This keeps the chrome's animations (nav-blur-on-scroll, sidebar transitions) implemented exactly once.

## Data loading pattern

- **Server Components fetch on the server** for anything needed for the initial paint (a startup's public profile page, `app/(marketing)/[slug]/page.tsx` when built) — direct `fetch()` to the API with Next's built-in caching/revalidation, not a client-side `useQuery` waterfall.
- **Client Components use `@vittamhub/api-client` hooks** for anything that needs mutation, polling, or optimistic updates (the dashboard feeds, forms).
- **`loading.tsx` per route segment** — the root `loading.tsx` (a centered spinner) is the last-resort fallback; any segment with meaningfully different content (the discovery feed, a profile page) should ship its own `loading.tsx` with `Skeleton`-shaped placeholders matching that segment's real layout, per the UX brief's "skeleton loaders everywhere."
- **`error.tsx` per segment where a partial failure shouldn't take down the whole shell** — e.g., if the notifications panel fails to load, that panel should show its own error/retry, not crash the whole dashboard. The root `error.tsx` is the catch-all for anything that doesn't opt into segment-level handling.

## API versioning and the web↔API boundary

Every API route is prefixed `/v1/...` (see [06-api-architecture.md](./06-api-architecture.md)) — the web app's route structure and the API's route structure are independent; nothing in `apps/web`'s URL scheme needs to mirror `apps/api`'s, and a `v2` API can be introduced without touching a single Next.js route.
