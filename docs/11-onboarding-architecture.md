# 11 — Onboarding Architecture

## The problem: autosave-every-step vs. normalized tables

Every onboarding flow (the Startup founder's 10-step wizard, and the shorter two-step flows for Investor/Mentor/Incubator/University/Service Provider/Job Seeker) needs to autosave partial, possibly-invalid answers as the user types — a founder filling in step 4 shouldn't lose step 2's answers, and closing the tab mid-flow shouldn't lose progress. But the destination schema (`Startup`, `Investor`, `MentorProfile`, ...) has real NOT NULL columns, foreign keys, and enum constraints that partial data can't satisfy. Writing every keystroke straight to those tables would mean constantly violating — or artificially relaxing — constraints that should hold once a profile is actually live and discoverable by other users.

The fix: a single `Json?` column, `UserProfile.onboardingDraft` (`apps/api/src/database/prisma/schema.prisma`), accumulates every step's raw answers as the user progresses. Nothing in the normalized tables is touched until an explicit **publish** step validates the complete draft against strict (non-partial) Zod schemas and commits everything in one Prisma `$transaction`. Autosave and data-integrity are solved independently: the draft can be arbitrarily incomplete or malformed between saves; the published tables are never in an inconsistent state because they're only ever written once, atomically, from validated data.

## The draft's shape

`onboardingDraft` is a flat object keyed by section name — `{ personalDetails, startupInfo, product, market, team, traction, funding, verification, preferences }` for the founder flow, or `{ personalDetails, investorInfo }` / `{ personalDetails, mentorInfo }` / etc. for the shorter flows. Each section's shape is described by that step's Zod schema, wrapped in `.partial()` where the accumulated schema is defined (`startupOnboardingDraftSchema` in `packages/types/src/domain/startup-onboarding.ts`) — partial because a mid-flow draft is allowed to be incomplete; only the publish-time parse uses the strict, non-partial version of each schema.

`personalDetails` (`personalDetailsInputSchema`, `packages/types/src/domain/user-profile.ts`) is shared verbatim across all seven registerable roles — full name, avatar, mobile number, date of birth, gender, nationality, LinkedIn/GitHub/portfolio links, location, bio. Every publisher applies it via the same helper (`apply-personal-details.ts`) before doing its role-specific work, so this data (and the `UserProfile` row it lands in) never needs to be duplicated per-role.

## Autosave: client → server round-trip

Every step component wires its `react-hook-form` `watch()` output into `useAutosave(section, step, data)` (`apps/web/src/hooks/useAutosave.ts`), which debounces 800ms and then calls `PATCH /v1/onboarding/draft` (`OnboardingController.saveDraft` → `OnboardingService.saveDraft`). The service does `{ ...existingDraft, [section]: data }` — merging one section into the stored JSON rather than replacing it wholesale, which is what makes "step 3 must never clobber step 2" hold. `onboardingStep` and `onboardingStatus` (`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED`) are updated on the same write.

In parallel, `useOnboardingStore` (`apps/web/src/store/onboarding-store.ts`, Zustand + `persist`) mirrors the same section-keyed draft into `localStorage` synchronously on every `setSectionData` call — this is what makes the current tab feel instant (no round-trip needed to move between wizard steps) and survives an accidental refresh or closed tab before the debounced network save lands. On mount, each wizard page (`.../onboarding/founder/page.tsx` and the six role-specific pages) hydrates from the server's draft (`useOnboardingState`) **only if the local store is empty** — the local draft is always at least as fresh as whatever was last confirmed saved, so it wins on the same device; the server copy is what lets onboarding resume on a *different* device.

Since the store's `draft` is typed as `Record<string, unknown>` (it's arbitrary JSON at rest, section shapes vary by role and step), reading a section back out for a step's `defaultValues` goes through the `draftSection<T>(draft, key)` helper in the same store file — a thin, explicit narrowing point rather than scattering `as` casts across every wizard page.

## Publish: strict validation, one transaction

`POST /v1/onboarding/publish` (`OnboardingController.publish`) dispatches by the authenticated user's `role` to one of seven publishers (`apps/api/src/modules/onboarding/publishers/`). Every publisher:

1. Re-validates its relevant draft section(s) against the **strict** (non-partial) schema — a user can't publish with required fields still missing, even if autosave happily persisted the partial state along the way.
2. Applies shared personal details, then upserts its role-specific table(s), inside a single `prisma.$transaction`.
3. Marks `UserProfile.onboardingStatus = "COMPLETED"` and clears the draft (`onboardingDraft: Prisma.JsonNull`) as the transaction's last step — publish is all-or-nothing.

The **Startup** publisher (`startup.publisher.ts`) is the most involved: it validates eight step schemas (all but `personalDetails`, which is shared, and `review`, which isn't a data step), generates a unique slug, and upserts `Startup` plus five child tables (`StartupTeamMember`, `StartupProduct`, `StartupMarket`, `StartupTraction`, `StartupFunding`, `StartupPreference`, `Document`) — team members and documents use a delete-then-recreate pattern since the wizard always submits the complete current list, not a diff. It's also the only flow with an explicit confirmation step: `Step10Review` requires a typed legal-name signature and a Terms-of-Service checkbox (`publishStartupInputSchema`), submitted as the request body alongside the (server-held) draft. The other six publishers read their draft straight from the stored `UserProfile.onboardingDraft` and don't require a separate confirmation payload — a deliberate scope simplification for the shorter flows; adding the same signed-confirmation pattern to them is straightforward if the product later requires it (mirror `publishStartupInputSchema` per role and thread it through `OnboardingController.publish`'s body the same way).

## Wizard step registry

`STARTUP_WIZARD_STEPS` (`packages/types/src/domain/startup-onboarding.ts`) is the single ordered list (`personal-details` → `review`) that drives the founder wizard's progress bar, step sidebar, and routing (`apps/web/src/app/(onboarding)/onboarding/founder/page.tsx`, `WizardShell`). The six shorter roles don't need a shared constant since they're always exactly two steps — personal details, then the role's info step — defined inline as `STEPS` in each role's `page.tsx`.
