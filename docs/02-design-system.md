# 02 — Design System

Single source of truth: [`packages/tokens/src`](../packages/tokens/src). Nothing in `apps/web` or `packages/ui` should hardcode a hex value, a px spacing number, or a font name — it should reference a token. This doc explains the *why* behind each token file; the values themselves live in code, not duplicated here, so they can't drift out of sync.

## Color ([`colors.ts`](../packages/tokens/src/colors.ts))

Three scales, each with a job:
- **`brand`** (50–950) — our one custom scale, anchored so `brand-400` is the spec's Secondary Blue (`#7EA7D8`) and `brand-600` is Primary Brand (`#5F89C8`). Every other step is a hand-tuned tint/shade around those two anchors.
- **`neutral`** (Tailwind `gray`) and **`slate`** (Tailwind `slate`) — used for text/borders and surfaces respectively. These aren't invented: `#F8FAFC`, `#0F172A`, `#020617`, `#E5E7EB`, `#111827`, `#6B7280` in the original brief are *exactly* Tailwind's default gray/slate palette, so we reuse Tailwind's scale rather than re-deriving one that happens to pass through the same six points.
- **`success` / `warning` / `danger` / `info`** — same reasoning: the spec's hexes are Tailwind's green-600, amber-500, red-600, and blue-500. Reusing the real scale means we get 50/100 tints for badge/alert backgrounds for free, correctly calibrated.

Components never reference `brand.600` or `neutral.900` directly — they use the **semantic layer** (`semanticColors.light` / `.dark`, exposed as CSS variables in `globals.css` and as Tailwind classes like `bg-brand-primary`, `text-text-secondary`). A rebrand or a contrast fix touches `colors.ts` once; no component changes.

## Typography ([`typography.ts`](../packages/tokens/src/typography.ts))

Four families, four jobs — never mixed:
| Family | Token | Used for |
|---|---|---|
| Henderson Sans | `fontFamily.brand` | Logo/wordmark only. Licensed asset — see the `next/font/local` setup in `apps/web/src/lib/fonts.ts`; falls back to Manrope until the `.woff2` files are added. |
| Manrope | `fontFamily.heading` | H1–H6, nav labels, card titles |
| Inter | `fontFamily.body` | Paragraphs, form labels, UI copy |
| IBM Plex Sans | `fontFamily.numeric` | Metrics, currency, stat tiles — anywhere a founder or investor is scanning numbers, tabular figures read faster |
| JetBrains Mono | `fontFamily.mono` | API keys, request IDs, code blocks |

`textStyles` composes family + size + weight + tracking into named styles (`h1`, `bodyBase`, `metricLg`, ...) so a designer reviewing a screenshot can say "that should be `h3`" instead of "20px Manrope semibold" — the vocabulary is the token name.

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
