# 04 — State Management Architecture

Four kinds of state, four different tools — picking the wrong tool for a given kind is the most common source of "why is this component re-rendering / why is this data stale" bugs, so the rule is enforced by category, not by preference.

## 1. Server state → TanStack Query (React Query)

Anything that lives in Postgres and the client is just viewing/mutating: startup profiles, investor profiles, connections, notifications, the current user. Owned by `@vittamhub/api-client`'s hooks (`useStartupSearch`, `useCurrentUser`, `useCreateStartup`, ...) — see [`packages/api-client/src/hooks`](../packages/api-client/src/hooks).

- **Query keys are centralized per entity** (`startupKeys.all/.search/.detail` in `useStartups.ts`) so invalidation (`queryClient.invalidateQueries({ queryKey: startupKeys.all })` after a mutation) can't typo a key and silently fail to invalidate.
- **`staleTime: 30_000` by default** (set in `app/providers.tsx`'s `QueryClient`) — most VittamHub data (startup profiles, investor lists) doesn't need to be real-time-fresh; this cuts refetch volume substantially at scale without any per-query configuration.
- **`placeholderData: (prev) => prev`** on paginated queries (`useStartupSearch`) keeps the previous page's cards visible while the next page loads, instead of a jarring skeleton-flash on every page change.
- **Mutations never update the cache by hand with guessed shapes** — either `invalidateQueries` (simple, one extra round-trip) or `setQueryData` with the *exact* server response shape (used in `useLogin`, which sets `["auth", "me"]` to the login response's `user` object directly, since that shape is already known and correct).

## 2. Client/UI state → Zustand

Anything that's purely client-side and doesn't survive a refresh from the server's perspective: sidebar collapsed/expanded, active filters in a not-yet-submitted search form, a multi-step onboarding wizard's current step. Not scaffolded with a concrete store yet (no such state exists before real features land), but the rule for when it is:

- **One store per feature**, created via a hook (`useOnboardingStore`, `useSidebarStore`), not one giant global store — keeps re-renders scoped and keeps the store file next to the feature that owns it (in `apps/web/src/store/`, or colocated with the feature if it's page-local).
- **Zustand, not Context**, for anything that changes frequently (scroll position, hover state, form-in-progress) — Context re-renders every consumer on every change; Zustand's selector pattern (`useStore((s) => s.field)`) only re-renders components that read the specific field that changed.
- **Zustand, not React Query**, for anything that isn't a server round-trip — don't invent a fake `useQuery` with a `queryFn` that just reads `localStorage`.

## 3. Form state → React Hook Form + Zod

Every form (login, register, startup profile edit, onboarding steps) uses `react-hook-form` with `@hookform/resolvers/zod`, validating against the **same Zod schema** the API validates with (`@vittamhub/types` — e.g. `createStartupInputSchema`, `registerInputSchema`). This is the concrete mechanism behind "every form should save automatically" and "multi-step forms should never lose data" from the UX brief:

- **Autosave**: `useForm`'s `watch()` + a debounced effect that calls a mutation on change, rather than a single submit button, for any long-form editor (startup profile, investor profile). Show a small "Saved" / "Saving…" indicator near the field, not a blocking spinner over the whole form.
- **Multi-step forms persist to Zustand (or `sessionStorage` via a Zustand persist middleware) on every step transition**, so a browser refresh or back-navigation mid-onboarding doesn't lose progress. The wizard's Zustand store is the source of truth; `react-hook-form` instances per step read their slice from it on mount.
- **Client and server validation can never disagree** because they're the same schema — a `ZodValidationPipe` (`apps/api/src/common/pipes/zod-validation.pipe.ts`) runs the identical schema server-side as the final authority; client-side validation is purely for instant feedback, never trusted as the security boundary.

## 4. URL state → Next.js `searchParams`

Anything that should be shareable/bookmarkable/back-button-able: discovery feed filters (`industry`, `stage`, `isFundraising`), the current page number, a selected tab. Lives in the URL (`?industry=fintech&stage=MVP&page=2`), read via `useSearchParams` / passed as `searchParams` prop to Server Components, and is what `StartupSearchFilters` (`@vittamhub/types`) is actually shaped to serialize into — see `startupsApi.search`'s `URLSearchParams` construction in `packages/api-client/src/endpoints/startups.ts`.

- Never duplicate this into Zustand — the URL *is* the state; reading `useSearchParams` on every render is cheap and keeps one source of truth instead of syncing two.

## Provider tree

Kept to a single client-boundary component (`apps/web/src/app/providers.tsx`) so `app/layout.tsx` stays a Server Component:

```
<ThemeProvider attribute="data-theme">      ← next-themes, see docs/02 dark-mode section
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</ThemeProvider>
```

Zustand stores need no provider (they're just hooks); this tree only grows when a genuinely global client concern shows up (e.g., a WebSocket connection provider for real-time notifications).
