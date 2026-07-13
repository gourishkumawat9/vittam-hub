# 03 — Component Library

Lives in [`packages/ui`](../packages/ui/src). Every app (`web` today; a future docs site or admin-only app tomorrow) imports from `@vittamhub/ui` rather than hand-rolling a button. This doc is the inventory: what's built as the foundation seed, what pattern to follow for everything not yet built, and the rules that keep the library from rotting into a pile of one-off variants.

## Layering (atomic-ish, not dogmatic)

```
tokens (packages/tokens)  →  primitives (packages/ui)  →  patterns (apps/web/src/components)  →  pages (apps/web/src/app)
```

- **Primitives** (`packages/ui`) know nothing about VittamHub's domain. `Button` doesn't know what a "startup" is. They take `variant`/`size`/`children` and render pixels.
- **Patterns** (`apps/web/src/components`, not yet built) compose primitives with domain data — `StartupCard`, `ConnectionRequestRow`, `VerificationBadge`. These live in the web app, not `packages/ui`, because they're one consumer's opinion about how to arrange primitives, not a reusable design-system piece.
- **Pages** compose patterns with data-fetching (`@vittamhub/api-client` hooks) and layout.

## Built in this foundation pass

| Component | File | Notes |
|---|---|---|
| `Button` | `components/Button/Button.tsx` | `cva`-driven variants (`primary`/`secondary`/`outline`/`ghost`/`danger`/`link`) × sizes (`sm`/`md`/`lg`/`icon`). `asChild` (Radix `Slot`) lets it render as a styled `<Link>`. Built-in `isLoading` spinner + `aria-busy`. Hover/tap scale via Framer Motion per the animation spec. |
| `Input` | `components/Input/Input.tsx` | Always renders a real `<label htmlFor>`; wires `aria-describedby`/`aria-invalid` automatically from `hint`/`error` props — screen-reader-correct without the caller remembering ARIA plumbing. |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` | `components/Card/Card.tsx` | `interactive` prop adds the "lifts slightly" hover behavior; omit it for static containers (forms, stat panels) so non-clickable surfaces don't look clickable. |
| `Badge` | `components/Badge/Badge.tsx` | Status pill — `neutral`/`brand`/`success`/`warning`/`danger`/`info`. Maps directly onto `VerificationStatus`, `ConnectionStatus`, `StartupStage` from `@vittamhub/types`. |
| `Avatar` | `components/Avatar/Avatar.tsx` | Radix `Avatar` under the hood — falls back to initials-on-brand-tint when `src` is missing or fails to load. Never a broken-image icon. |
| `Skeleton` | `components/Skeleton/Skeleton.tsx` | Compose into shapes that mirror real content (see next section) — not a generic spinner. |
| `EmptyState` | `components/EmptyState/EmptyState.tsx` | Icon + title + description + optional action — the "nothing here yet" state every list/table must render. |

## Not yet built — the pattern to follow when they are

Each of these should follow the `Button`/`Card` pattern (cva variants where there's more than one visual mode, Radix primitive underneath where accessibility is nontrivial, Framer Motion for the specific animation called out):

- `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea` — form primitives, pair with `react-hook-form` + the Zod resolvers already wired in `apps/web/package.json`
- `Dialog` / `Sheet` — Radix `Dialog` already a dependency; modal radius token (`rounded-modal`, 20px) is defined and waiting
- `DropdownMenu` — Radix dependency already present
- `Toast` — success/error feedback; pairs with the "success animations, error recovery" UX principle
- `Tabs`, `Tooltip` (Radix `Tooltip` dependency present), `Pagination`, `DataTable`
- `NavBar` (marketing) — the component that implements "navbar becomes blurred while scrolling" via the `.nav-blur` utility class already defined in `globals.css`; needs a scroll-position hook to toggle it
- `Sidebar` / `Topbar` (dashboard chrome) — referenced as `TODO` in `apps/web/src/app/(dashboard)/layout.tsx`

## Loading, empty, and error states — the actual UX contract

The brief calls for "skeleton loaders, empty states, success animations, error recovery" everywhere. The concrete contract this codebase should enforce:

1. **Every data-fetching component has three renders**: loading (`Skeleton` shapes matching the real layout — e.g., a `StartupCard` skeleton is an `Avatar`-sized circle + two text-line rectangles, not a spinner), empty (`EmptyState` with a relevant icon and a next action), and populated.
2. **Every mutation (`useMutation` from `@vittamhub/api-client`) surfaces its error via `ApiClientError`**, which already carries a stable `code` — pair with a `Toast` (once built) rather than a raw `alert()` or console error.
3. **Optimistic updates use React Query's `onMutate`/`onError` rollback pattern** for anything reversible (accepting/declining a connection, toggling `isFundraising`) so the UI feels instant but survives a failed request.

## Storybook / visual review

Not scaffolded in this pass — recommended next step once 3–4 more primitives exist, so there's enough surface area to justify the setup cost. Until then, `apps/web/src/app/(marketing)/page.tsx` (or a temporary `/dev/components` route) can serve as the visual smoke test.
