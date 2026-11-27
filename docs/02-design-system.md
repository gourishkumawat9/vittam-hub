# 02 — Design System

Single source of truth: [`packages/tokens/src`](../packages/tokens/src). Nothing in `apps/web` or `packages/ui` should hardcode a hex value, a px spacing number, or a font name — it should reference a token. This doc explains the *why* behind each token file; the values themselves live in code, not duplicated here, so they can't drift out of sync.

## Color ([`colors.ts`](../packages/tokens/src/colors.ts))

Three scales, each with a job:
- **`brand`** (50–950) — our one custom scale, anchored so `brand-400` is the spec's Secondary Blue (`#7EA7D8`) and `brand-600` is Primary Brand (`#5F89C8`). Every other step is a hand-tuned tint/shade around those two anchors. This is the owner's chosen blue, in the same calm mid-blue family as the Goldman Sachs logo (`#6B96C3` / `#7399C6` in public brand-colour references). A deeper navy "trust blue" was tried in November 2026 and rolled back at the owner's request, so keep this scale. White on 600 is 3.6:1: fine for buttons and large text; use 700 for small text on white, and 700 or deeper for blue bands that carry white body text.
- **`neutral`** (Tailwind `gray`) and **`slate`** (Tailwind `slate`) — used for text/borders and surfaces respectively. These aren't invented: `#F8FAFC`, `#0F172A`, `#020617`, `#E5E7EB`, `#111827`, `#6B7280` in the original brief are *exactly* Tailwind's default gray/slate palette, so we reuse Tailwind's scale rather than re-deriving one that happens to pass through the same six points.
- **`success` / `warning` / `danger` / `info`** — same reasoning: the spec's hexes are Tailwind's green-600, amber-500, red-600, and blue-500. Reusing the real scale means we get 50/100 tints for badge/alert backgrounds for free, correctly calibrated.

- **`trustTier`** (V0–V3) — one colour per verification level, used only on trust labels (`TrustTierBadge`), never as a second brand accent: V0 self-declared (slate), V1 document-supported (blue), V2 independently corroborated (violet), V3 matched against an authoritative source (green). Each label carries the level's name too, so colour is never the only signal.

Buttons that carry white text use `brand-700`, not `brand-600`, so small button text clears 4.5:1. Warning text uses `warning-700` (`#B45309`) for the same reason.

Components never reference `brand.600` or `neutral.900` directly — they use the **semantic layer** (`semanticColors.light` / `.dark`, exposed as CSS variables in `globals.css` and as Tailwind classes like `bg-brand-primary`, `text-text-secondary`). A rebrand or a contrast fix touches `colors.ts` once; no component changes.

## Typography ([`typography.ts`](../packages/tokens/src/typography.ts))

One typeface, Manrope, for everything since November 2026 (self-hosted, see `apps/web/src/fonts/README.md`). Inter, IBM Plex Sans and JetBrains Mono were dropped: one family keeps the interface calm, and numbers use Manrope with `tabular-nums` so columns of figures still line up.

| Token | Family | Used for |
|---|---|---|
| `fontFamily.brand` | Henderson Sans, falling back to Manrope | Logo/wordmark only (licensed asset, not yet added) |
| `fontFamily.heading` / `body` / `numeric` | Manrope | Headings, UI copy, metrics |
| `fontFamily.mono` | System monospace | Request IDs and code only |

`textStyles` composes family + size + weight + tracking into named styles (`h1`, `bodyBase`, `metricLg`, ...) so a designer reviewing a screenshot can say "that should be `h3`" instead of "20px Manrope semibold" — the vocabulary is the token name.

In the app, the same idea is a set of text classes in `apps/web/src/styles/globals.css`, numbered from biggest to smallest within each role:

- `heading-1` to `heading-6`: page titles. A dashboard page title is `heading-5`; a section inside it is `heading-6`.
- `title-1` to `title-5`: card and panel titles (`PanelTitle` uses `title-3`), list item names (`title-4`).
- `body-3` to `body-6`: running text.
- `caption-1` to `caption-5`: secondary text in the muted grey (`caption-5` for hints under a field).

Use sentence case for every heading and button ("Connect requests", not "Connect Requests"). Text never truncates inside a panel title: titles wrap, and the right-hand action wraps under them on a phone.

## Spacing, radius, breakpoints ([`spacing.ts`](../packages/tokens/src/spacing.ts))

Strict 8-point grid (4/8/12/16/24/32/40/48/64/80/96/120), matching the brief exactly — no ad hoc 10px or 18px gaps. Radius is role-based, not size-based: `radius.card` (16px), `radius.button`/`radius.input` (12px), `radius.modal` (20px) — so "make this button's corners match the input next to it" is automatic, not a coincidence of picking the same number twice. Breakpoints (`sm`–`2xl`) top out at `1440px`, the spec's max content width, enforced via `max-w-content` in Tailwind.

## Shadow ([`shadows.ts`](../packages/tokens/src/shadows.ts))

Five steps (`xs`–`xl`), all low-opacity black-on-white in light mode (`shadow`) and low-opacity black-on-black in dark mode (`shadowDark`) — dark-mode shadows need *more* opacity to read at all against a dark surface, not less, which is why they're a separate scale rather than the same values reused. No heavy multi-layer material shadows anywhere; depth reads as "premium paper," matching the "very subtle, no heavy material shadows" directive.

## Motion ([`motion.ts`](../packages/tokens/src/motion.ts))

Framer Motion variants, not raw CSS transitions, because the brief's animation list (page fade/slide/scale, card lift, button scale, staggered card entrances, blurring nav) all need JS-driven orchestration (stagger, exit animations, scroll-linked blur) that CSS alone can't express cleanly.

- `fadeIn`, `fadeSlideUp`, `scaleIn` — page/section entrances
- `cardHover` — the "cards lift slightly" hover behavior (`Card` component's `interactive` prop)
- `buttonTap` — the "buttons slightly scale" hover/press behavior (built into `Button`)
- `staggerContainer` — wrap a grid of startup/investor cards to get "fade into view" staggered by 60ms per child
- `reducedMotionFallback` — every component that imports a variant should branch on `useReducedMotion()` (Framer Motion's built-in hook) and swap to this opacity-only fallback, satisfying the WCAG reduced-motion requirement without a second implementation per component

In Tailwind, transitions use `ease-base` (`cubic-bezier(0.22, 1, 0.36, 1)`, a quick start with a soft landing) and 200ms; Framer Motion entrances on the home page use the same curve.

Durations are short (100–500ms) and easings avoid springy overshoot outside of `easing.spring`, reserved for small delight moments (counters ticking up, a success checkmark) — enterprise surfaces should feel calm, not bouncy.

## Dark mode

`next-themes` toggles `data-theme="dark"` on `<html>` (see `apps/web/src/app/providers.tsx`). Two things key off that attribute, and they're kept in sync deliberately:
1. `globals.css` — CSS variables (`--color-background`, etc.) flip under `:root[data-theme="dark"]`
2. `tailwind-preset.ts` — `darkMode: ["selector", '[data-theme="dark"]']`, so raw `dark:` utility classes (e.g. `dark:bg-neutral-800` in `Skeleton`) key off the same attribute rather than Tailwind's default `.dark` class strategy

If a future contributor reaches for Tailwind's default `class` dark-mode strategy instead of this attribute selector, `dark:` utilities will silently stop working — this is the one place the token system and the framework config have to agree, and it's worth a second look if dark mode ever seems "half-applied."

## Accessibility baked into tokens, not bolted on

- `focusRing` shadow token + `:focus-visible` global rule → every interactive element gets a visible 2px brand-colored ring, not a browser default outline
- `success`/`warning`/`danger`/`info` were chosen from Tailwind's palette specifically because they clear WCAG AA contrast against both `background` and `background-secondary`
- `reducedMotionFallback` (above) — every motion variant has an opt-out

## Icons ([`packages/ui/src/icons`](../packages/ui/src/icons))

VittamHub draws its own icons; there is no stock icon library in the app (lucide-react was removed in November 2026 because the stock outlines read as machine-made and cost trust). Import from `@vittamhub/ui/icons` (inside `packages/ui`, from `../../icons`).

- **The line:** a 24px grid, a 1.75 stroke, flat (butt) ends and mitred corners, taken from the cut terminals of the official mark. Dots are small squares (`Pt`), never circles.
- **The second tone:** each icon's subject sits on a quiet plane of the current colour at 16% (`Tint`), so the set reads as one family. Utility glyphs (arrows, chevrons, check, close) have no plane.
- **Use:** `currentColor` only, at 16, 20, 24 or 32px. Never put an icon in a coloured circle or tile, and never use an emoji as an icon. On marketing pages the icon sits on its own above or beside the heading in `text-brand-primary`.
- **No sparkles.** The four-point "AI" sparkle is deliberately missing. Recommendations use `Target`, profile strength uses `Gauge`.
- **Adding one:** draw it with `createIcon("Name", <>…</>)` in `icons/index.tsx` on the same grid and rules, add a `Tint` for its subject, and check it at 16px next to its neighbours. Don't copy paths from Lucide, Heroicons or similar; brand marks (GitHub, LinkedIn) are the only outside shapes.

## Patterns

**Dashboard pages** start with `PageHeader` (title, one-line description, up to two actions), then a `StatStrip` of three or four numbers, then the work that needs the person ("Needs your reply"), then everything else in panels with `PanelTitle`. Empty states are a dashed card with one sentence and one action, never a blank space.

**Onboarding asks for the essentials first.** Each role's wizard has a short required path (for founders: About you, Your startup, What you need, Review and publish) and optional sections that can be filled now or later from the review step. Inside a step, required fields come first; extras sit in a folded `MoreDetails` panel that opens by itself when it already holds saved answers. Short choices use `ChoiceChips` (one tap per answer) instead of dropdowns. Each step header shows a rough time ("About 2 min") so the ask feels as small as it is. The pieces live in `apps/web/src/components/onboarding/fields.tsx`.

**Marketing sections show the product.** Where a section explains a feature, it shows the real screen beside the words (`ProductShot` in a light blue panel), not an icon grid. The home page's "What you can do today" is a product tour: pick a feature on the left, its screen shows on the right. On wide screens it steps through by itself (7 seconds each, with a bar showing when it moves on), stops when the visitor picks a feature or presses "Pause the tour", pauses on hover and keyboard focus, and never moves with reduced motion or on phones, where each feature opens onto its own screen in place. Screens stay inside their panel's sides so the frame's "Demo data" tag is always visible (CLAUDE.md §2). Retake the screens in `data/product-shots.ts` when a dashboard changes noticeably.

**FAQ answers stay true.** The home page's questions (`data/faq.ts`) describe how the product works today: the free plan, connect requests, what "Verified" means, who sees documents, mentor sessions. When one of those rules changes, change the answer with it.

**Public profiles read like a company page.** A light blue cover (never a stock photo), the logo overlapping it, name, tagline and a one-line facts row, then the story on the left (About, problem and solution, business model, team, milestones, activity) and a sticky "Key facts" card on the right with what verification means today. Every section shows only what the member filled in; nothing is padded out. New profile fields belong in the key facts list or as a section in the story column.
