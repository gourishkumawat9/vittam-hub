# VittamHub — Project Status

_Honest snapshot. No marketing, no fabricated numbers (per CLAUDE.md §2)._
_Last updated: this reflects the state at the most recent push, including a full 8-flow browser click-test._

## One-paragraph truth

VittamHub is a working full-stack platform (NestJS + Prisma + PostgreSQL + Redis backend, Next.js frontend) that runs **only on the developer's machine right now**. It is **not deployed** — there is no public website, and the registered domain `vittamhub.com` is not connected to anything yet. The backend is proven (APIs tested, 32 auth tests + 16 trust-model tests green, CI pipeline built), and the core founder→investor loop has now been **click-tested end-to-end in a real browser** (see below) — three real bugs were found this way and fixed.

## Browser click-test results (2026-07)

Walked the full founder↔investor loop in a real (Playwright/Chromium) browser, one flow at a time. All 8 now **WORK**:

| # | Flow | Result |
|---|---|---|
| 1 | Sign up → verify email → log in | WORKS |
| 2 | Complete the full startup onboarding wizard (all 10 steps) → publish | WORKS (after fix) |
| 3 | View that startup's public profile page | WORKS |
| 4 | Sign up as an investor → complete onboarding | WORKS |
| 5 | Search and find the startup | WORKS |
| 6 | Send a connect request | WORKS (after fix) |
| 7 | Accept it | WORKS (after fix) — **the investor accepts, not the founder**; see note below |
| 8 | Send a message | WORKS |

**Note on flow 7:** the task described it as "accept it as the founder," but the platform's actual design (CLAUDE.md §4) has the *investor* accept a founder-initiated connect request — founders can never message investors directly, and the request flows one way. That's the intended architecture, not a bug; the click-test confirmed the investor-side accept works.

### Bugs found and fixed during this click-test

1. **Onboarding wizard silently lost data** (`apps/web/src/hooks/useAutosave.ts`) — the debounced autosave (800ms) was cancelled on unmount with no flush. Clicking "Continue" within 800ms of editing a field discarded that edit, and publish later failed with a confusing "section incomplete" error. Fixed by tracking a pending-save flag and flushing it on unmount.
2. **"Send request" button did nothing** (`packages/types/src/domain/connection.ts`) — `pitchDeckUrl`/`executiveSummaryUrl`/`demoLinkUrl` used `z.string().url().optional()`, which rejects `""` (what an empty form field sends). Validation failed silently and no request was ever POSTed. Fixed with a shared `urlOrEmpty` schema that treats `""` as absent.
3. **Investor's incoming requests list always empty** (same file) — `connectionListFiltersSchema.pageSize` was capped at `.max(50)`, but the requests page and the connection-detail page both request `pageSize: 100`, so every fetch failed with 400 and rendered "No pending requests" even though a request existed. Raised the cap to `.max(100)`.

All three are real, user-facing defects that only a browser click-test — not the existing API test suite — would surface. Typecheck (8/8), lint (7/7), and the unit suite (31/31) all still pass after the fixes.

## Real data in the database

| Thing | Count | Note |
|---|---|---|
| Startups | 16 | "Demo Startup QA" plus accumulated dev/e2e-test fixtures — not real companies (count as of 2026-07-25; grown since the click-test was run, mostly from repeated e2e test runs) |
| Users | 43 | all test accounts created during development/testing |
| Real users / real startups | 0 | pre-launch |

## What actually works today

**Verified in a browser (a person can click and use):**
- Public landing / marketing pages (with the official logo + favicon)
- Sign up / create account, log in / log out
- Email verification — but the code prints to the server console (real email not configured yet)
- Full startup onboarding wizard, end to end, publishing a real startup profile
- Startup public profile page
- Investor sign-up + onboarding
- Search finds a published startup
- The full connect loop: founder sends a connect request → investor accepts → both sides message (see click-test table above)

**Backend proven via API tests, but not yet click-tested in the browser:**
- Scheduling a meeting after a connect is accepted
- Community (posts / comments / likes / bookmarks), follows, watchlist
- Notifications, admin plan-limit editing
- Jobs, and the remaining actor directories (mentors, incubators, universities, service providers)

## Infrastructure

| Piece | Status |
|---|---|
| Database (Neon PostgreSQL, Singapore) | live, 57 tables, migrated + seeded |
| Redis (Upstash, Singapore) | live |
| Object storage (Cloudflare R2) | not yet configured |
| Email (Resend) | not yet configured — verification codes log to console |
| Domain (`vittamhub.com`, Cloudflare) | registered, not connected |
| Deployment (Vercel + Railway) | not started |
| CI (GitHub Actions) | built: lint · typecheck · unit · build · e2e (Postgres+Redis services) |

## Testing

- **Auth:** 15 unit + 15 e2e (register/login/refresh/logout/RBAC/rate-limit), isolated `vittamhub_test` schema.
- **Trust Score v2:** 16 unit tests — reproduces the target ladder exactly, proves P4 (typing cannot raise the score), decay, band hysteresis.
- **Everything else:** no automated tests yet. The startup/investor/verification/matching surfaces are unprotected — characterization tests are planned before those are changed.

## Foundation migration (2026-07-25)

Applied a coordinated Prisma migration to the live Neon DB to fix four data-model gaps this doc previously flagged as known issues, ahead of building out the full 30-bundle startup profile spec:

- **Money is now INR-first, amount + currency.** Every `*Usd` column (`Startup.fundingRaisedUsd`, `StartupTraction`'s revenue/ARR/MRR, `StartupFunding`'s raise/valuation/burn, `Investor` cheque sizes, `Job`/`JobSeekerProfile` salaries, `Connection.fundingRequirementUsd`, `Investment.amountUsd`) was renamed to `*Amount` and paired with a `currency` column (`Currency` enum, default `INR`). Existing values were preserved via `RENAME COLUMN`, not dropped and recreated.
- **`industry` is now a fixed taxonomy**, not free text — new `Industry` enum (28 categories). Existing rows were mapped automatically ("FinTech" → `FINTECH`); anything unmapped falls back to `OTHER`, never silently dropped.
- **Metric history**: new `MetricObservation` table (startup, metric key, value, currency, period, source, verification tier) — the mechanism for storing revenue/users/headcount/valuation as dated series instead of overwrite-in-place columns. Not yet backfilled or written to by any service — that's the next piece of work.
- **Verification ledger**: new polymorphic `VerificationRecord` table (entityType/entityId/field/tier V0–V3/method/status/expiresAt/rawResponse), same pattern as the existing `AuditLog`. `VerificationEngineService` now writes a row to it on every status transition it computes (today's signals are still document-presence checks — V1, not registry-verified V3 — real MCA/GSTIN/DPIIT integrations are future work).
- **Trust Score v2 is now live in shadow mode**: `TrustEngineService` (`apps/api/src/modules/trust/trust-engine.service.ts`) computes the pure v2 model against real signals only (typing anything contributes 0) and persists it to a new `TrustScoreSnapshot` table every time the existing v1 score is requested — v1 is still what users see (unchanged, per the `FF_TRUST_V2` cutover plan already noted in `trust-compare.ts`), but v2 is now accumulating real score history instead of starting cold whenever that flag flips. `Startup.stage` also gained sibling `productStatus`/`revenueStatus`/`fundingStatus`/`declaredStage`/`monthsInCurrentStage` columns (all optional, not yet surfaced in the UI) for the eventual 3-axis stage model.

Verified: `prisma migrate deploy` applied clean against live Neon (existing rows checked post-migration — no data loss), `turbo run typecheck`/`lint` 8/8 and 7/7 green, unit (31/31) + e2e (17/17) tests green, seed script runs, and a live smoke test confirmed `TrustEngineService` correctly computes and persists a real snapshot for the demo startup.

## Verification engine + two-sided confirmation (2026-07-26)

Phase 2: built the verification *engine* (pluggable registry checks) and the two-sided confirmation system spec §9 calls "the actual moat" — the free, unfakeable mechanism where a claimed relationship only counts once the other party confirms it.

- **`RelationshipClaim` model + `RelationshipClaimsService`/controller**: an Investor/IncubatorProfile/UniversityProfile/Startup can claim a relationship (portfolio investment, lead investor, board seat, incubator alumnus, university spinout, strategic partner) with another profile. It starts `PENDING`; only the claimed-about party can `CONFIRM`/`DENY` it. A `CONFIRMED` claim writes a V2 `VerificationRecord` for **both** sides automatically (2-year TTL — verification always expires) and fires notifications (3 new `NotificationType`s). Unconfirmed claims stay worth zero trust, per spec.
- **Verification provider registry** (`apps/api/src/modules/verification/providers/`): a common `VerificationProvider` interface, one implementation per registry named in the spec — MCA, GSTIN, DPIIT, SEBI, Patent Office, UGC/AICTE, ICAI/Bar Council, DigiLocker. Every one of them is config-gated (its own `*_API_KEY` env var) and returns an honest `PENDING` placeholder — never a fabricated result and never a manual-review queue — until a real key is supplied. `VerificationOrchestratorService` runs any registered check against a caller's *own* profile only, and writes the resulting `VerificationRecord`.
- **Two real (non-placeholder) V2 checks now run automatically**: work-domain email (free heuristic, auto-runs on every `profile.upserted` event, writes a `VerificationRecord` once per user) and phone OTP (`PhoneVerificationService`, real hash/expiry/attempt-capped OTP round-trip over the existing `OtpCode` model + a new `SmsService` that — like `EmailService` before it had Resend — logs the code to the console until an SMS provider is configured). A confirmed phone OTP sets the new `User.phoneVerifiedAt` column.
- **`TrustEngineService` (v2, shadow mode) upgraded**: `phoneVerified`, `workDomainEmail`, `mcaVerified`/`dpiitVerified`/`gstinVerified`, and `investorTwoSideConfirmed` now read real ledger/claim data instead of hardcoded `false` — the MCA/DPIIT/GSTIN signals will flip true automatically the moment those provider API keys are configured, with no further code change.

Verified live against Neon: migration applied clean (purely additive — new enum values, one nullable column, one new table), `turbo run typecheck`/`lint` all green, unit 31/31 + e2e 17/17 green, seed runs, and a live smoke test walked the full loop — created and confirmed a real `RelationshipClaim` between the demo startup and a seeded investor (verified `VerificationRecord` rows written on both sides), ran the MCA check unconfigured (correctly `PENDING`), triggered the auto work-domain-email check, and completed a phone OTP request/reject cycle. Startup trust score rose 29 → 32 (Bronze) purely from the new real signals, no fabricated ones.

## Trust Score v2 productization (2026-07-26)

Phase 3: turned the v2 scoring model (still shadow-mode, not shown to anyone but the founder) into something a founder can actually act on.

- **`GET /v1/startups/me/trust-preview`** — founder-only endpoint returning the full v2 breakdown, **next-best-actions** (the components with the biggest point gap at the founder's current stage, sorted, with a plain-language suggestion per component — "Get your MCA, DPIIT, and GSTIN registrations verified," etc.), and up to 30 recent score-history points. Nothing here is shown to investors or on the public profile; v1 (`TrustScoreCard`) is still the score everyone else sees.
- **Frontend**: new `TrustScoreV2PreviewCard` on the founder dashboard, visually distinct (dashed border, "preview" labeling, flask icon) so it can never be mistaken for a second real score.
- **Daily BullMQ recompute job** (`trust-recompute` queue, `TrustRecomputeService`/`TrustRecomputeProcessor`, idempotent `upsertJobScheduler`, 03:00 UTC): recomputes and persists a v2 snapshot for every public startup once a day. This is what makes the model's freshness/dormancy penalties (`profileFresh30d`, `metricsFresh45d`, `dormantOver180d` in trust-model.ts) real — a score now visibly drifts down if a founder goes quiet, not only when they happen to reopen their dashboard.

Verified live: `turbo run typecheck`/`lint` 13/13, unit 31/31 + e2e 17/17 (including the full-app-boot `app-module.e2e-spec.ts`, confirming the new BullMQ queue and controllers wire into Nest DI correctly, not just `tsc`-clean), seed runs, and a live smoke test called `getPreview()` directly (correct next-best-actions ordering, real history) and then enqueued the actual recompute job through the real app context — confirmed via job state polling and a DB check that it processed and wrote a fresh snapshot for **all 16** startups in the database, not just the one under test.

## Deepening the core bundles (2026-07-26)

Phase 4: took the six-to-eight core startup bundles from "field exists" to "actually behaves like the spec."

- **3-axis stage (Bundle 3)** is now real, not just schema: the onboarding wizard (Step 2) asks for product/revenue/funding status separately, plus the founder's own stage guess. `Startup.stage` (the label shown everywhere) is now *computed* by a new pure `deriveOverallStage()` function — the furthest-progressed of the three axes, on the same ordinal scale — never just typed. The founder's own guess is kept as `declaredStage`; a mismatch between the two now actually feeds the `declaredNeqVerifiedStage` trust penalty (previously always false). 7 unit tests, including a monotonicity property test.
- **Traction as real history (Bundle 10)**: every onboarding publish *and* a new "update your traction" endpoint (`POST /v1/startups/me/traction`) now writes to `MetricObservation`, not just the overwrite-in-place `StartupTraction` row. `GET /v1/startups/me/traction-history` returns dated points grouped by metric key — the data a trend chart needs. `MetricObservation` had existed since Phase 1 but nothing wrote to it until now.
- **Funding rounds as history (Bundle 12)**: new `FundingRound` table — one row per historical round (type, instrument, amount, valuation, lead investor, dilution, close date), not the single overwrite-in-place `StartupFunding` snapshot. Total raised is now *computed* (summed from rounds), never a typed-once number. Founder-facing add/list/delete endpoints.
- **Documents as a permissioned data room (Bundle 21)**: new `DocumentGrant` (per-viewer, 14-day default expiry, optional NDA gate) and `DocumentView` (append-only view log) tables. Every gated document now goes through one access path (`GET /v1/documents/:id/access`) that checks for an active, NDA-satisfied grant and logs the view before returning the file — never a raw handed-out URL. Founders get a "Documents" page (new sidebar entry) to grant/revoke access to accepted-connection investors and see who's opened what, how many times ("Blume opened your deck twice" — spec's own phrasing). Investors get `GET /v1/documents/shared-with-me`.

Verified live against Neon: migration applied clean (purely additive), `turbo run typecheck`/`lint` 13/13 and 8/8, unit 38/38 (7 new stage tests) + e2e 17/17, seed runs. A live smoke test through the real Nest app context walked all four: updated traction and confirmed grouped history, added a funding round and confirmed the computed total, and ran the full document data-room lifecycle — granted access with an NDA requirement, confirmed access is blocked until the NDA is accepted, confirmed it unlocks after acceptance, confirmed the view count increments (2 views logged), confirmed the founder's grant list and the investor's shared-with-me list both show it, then revoked it and confirmed access is blocked again.

## Multi-actor depth + symmetric accountability (2026-07-26)

Phase 5: audited what "symmetric accountability" (spec §9/§10) actually required across investor/mentor/incubator/university, built what was genuinely missing, and confirmed (rather than rebuilt) what Phase 2 already covered generically.

- **Investor response-rate / median-reply time was already fully built** (`InvestorMetricsService`, pre-existing) and already public on every investor profile — audited, not new work. No gap there.
- **Mentor reputation was the real gap.** The platform only had "mentor reviews founder" (`FounderReview`) — the *reverse* of spec §5's actual mechanism ("after each real, accepted mentoring session, the founder rates the mentor... a mentor with 12 good ratings is trusted"). Added a new `MentorReview` model (founder → mentor, same one-review-per-accepted-booking gating as `FounderReview`, unique-constraint-enforced) and `MentorReputationService` (average rating + session count, computed not stored). Now live on the public mentor profile page and a new "Review mentor" flow on the founder's bookings page, symmetric to the mentor's existing "Review founder" flow.
- **Investors get a Trust Score too** (spec §4/§28: "every user type" — CLAUDE.md §8's protecting-founders-from-fake-investors principle). Deliberately a simpler model than the startup-shaped v2 (product/revenue evidence isn't meaningful for an investor) — a small, auditable weighted-factor score (email verified, work-domain email, KYC document, SEBI-verified, MCA-verified, response rate, profile completeness), persisted to the same polymorphic `TrustScoreSnapshot` table under `entityType: "Investor"`. Public profile shows score+band only, same "never expose the breakdown externally" convention as startups.
- **Incubator/university/service-provider two-sided confirmation and registry checks needed no new code** — `RelationshipClaimsService` (Phase 2) already generically supports `IncubatorProfile`/`UniversityProfile` as claimant or target, and the `UGC_AICTE_API`/`ICAI_BAR_API` providers (Phase 2) already cover universities and service providers via the existing generic `VerifiableEntityType` union. Added one more registry provider stub — `AIM_DST_INCUBATOR_API` (Atal Innovation Mission / DST-supported incubator lists, spec §6) — for completeness; same config-gated `PENDING`-until-configured pattern as every other registry provider.

Verified live against Neon: migration applied clean (purely additive — one new table), `turbo run typecheck`/`lint` 8/8 and 13/13, unit 38/38 + e2e 17/17, seed runs. A live smoke test through the real app context created a real mentor + accepted booking, submitted a founder→mentor review, confirmed the reputation service correctly went from `{averageRating: null, reviewCount: 0}` to `{averageRating: 5, reviewCount: 1}`, confirmed a duplicate review on the same booking is correctly rejected, confirmed the provider registry now lists 10 methods including the new incubator check, and confirmed the investor trust score computes honestly (20/STARTING for the demo investor — no SEBI/MCA/KYC/domain-email yet, correctly not fabricated).

## Permission/privacy + connect hardening (2026-07-26)

Phase 6, closed two honest gaps from Phase 5 first (investor trust score had no frontend card; mentor reputation wasn't on list/search cards — both now show, via cheap batched-read endpoints so list pages don't trigger a recompute storm), then found and fixed a real, live data-exposure gap.

- **The public startup profile was returning the raw database record.** `getBySlug` and search results spread the full Prisma row straight into the response — exact revenue, MRR/ARR, monthly burn rate, current raise, funding goal, and valuation (all PRIV/INV-only per the spec's own field tags) were visible to *anyone*, logged in or not. Fixed with `StartupPublicProjectionService`: every non-owner view now goes through `project()`, which bands revenue/ARR/MRR into ranges (`₹50L–1Cr`, spec's own example format) or hides them per the founder's `metricsVisibility` setting, and always strips burn/raise/goal/valuation unless the viewer is an authenticated investor. Owners always see their own raw record.
- **New `ProfileVisibility` (PUBLIC/INVESTOR_ONLY/PRIVATE/STEALTH) and `MetricVisibility` (EXACT/BAND/HIDDEN)** on `Startup`, founder-configurable via `PATCH /v1/startups/me/visibility`, with a settings card on the founder dashboard. Additive to the existing `isPublic` boolean, which still gates discovery inclusion as it always has.
- **Fixed a real bug this uncovered**: `@Public()` routes previously skipped JWT verification *entirely*, so there was no way for a public startup-profile request to know if the caller was a logged-in investor — the exact distinction the projection needs to decide exact-vs-banded. `JwtAuthGuard` now does "soft auth" on public routes: a valid token still populates `request.user`, but a missing/invalid one never blocks the request (protected routes are completely unaffected — still 401 on anything but a valid token, verified explicitly below). This is a general-purpose capability the platform didn't have before and other features will likely want.
- **Growth benchmarking** ("your growth is top 22% of seed fintech" — spec's own example): `BenchmarkService` computes a real percentile against real peers (same industry + stage, from `MetricObservation`/`StartupTraction` growth-rate data). Below 3 real comparable peers, it returns `percentile: null` with a reason instead of fabricating precision off a tiny sample — CLAUDE.md §2. New card on the founder dashboard.
- **Audited, not rebuilt**: admin-configurable connect-request quota (`PlanLimitsService`/admin controller) and "who viewed your profile" (`ProfileViewsService`) were already fully built in earlier work — confirmed both work as designed, no gap, no new code needed.

Verified live against Neon: migration applied clean (purely additive — two new enums, two new nullable-with-default columns, no new tables), `turbo run typecheck`/`lint` 8/8 and 13/13, unit 38/38 + e2e 17/17 (including the full auth suite — the guard change touches every route in the app, so this was the highest-risk piece of the phase). A live smoke test confirmed: banding math correct at multiple thresholds, a stranger viewing a startup sees banded revenue and null valuation/burn/raise while an investor and the owner both see exact figures, a `PRIVATE` startup correctly 404s for a non-owner, the benchmark correctly refuses to fabricate a percentile from zero peers, and — against a real running HTTP server — a public profile returns 200 with no token AND with a garbage token, while a protected route correctly returns 401 in both of those same cases.

## Known issues / honest caveats

- v1 (typing-rewarding) trust score is still what's shown to users; v2 is computed and stored but not yet live — cutover is a deliberate future step (`FF_TRUST_V2`), not an oversight.
- `MetricObservation` now gets written on traction publish/update (Phase 4), but nothing backfills history for startups that published *before* this change — their trend charts start from whenever they next update a metric, not from account creation.
- Every government-registry provider (MCA/GSTIN/DPIIT/SEBI/Patent Office/UGC-AICTE/ICAI-Bar/DigiLocker/AIM-DST-Incubator) is a config-gated `PENDING` placeholder — none has a real API key or integration yet (spec's own note: confirm each registry's current access method before building — that's a research spike, not a coding task).
- Investor Trust Score isn't shown anywhere in the frontend yet (API returns it on `me`/`:id`, no UI card built this phase) — same "backend real, frontend pending" gap the relationship-claims/phone-verification work already has.
- Per-field visibility overrides (spec Bundle 30's arbitrary public/investor-only/private per individual field) aren't built — only the built-in PUB/INV/PRIV classification baked into `StartupPublicProjectionService` (revenue bands, funding fields). A founder can't yet mark one specific extra field private beyond that.
- Search's pagination `totalItems` count can be very slightly off from the actual returned `items.length` in the rare case a startup is `visibility: INVESTOR_ONLY` viewed by a non-investor — that check happens per-viewer after the count query runs, since a shared list query can't know the viewer's role for every row. Edge case, not the common path (`PRIVATE`/`STEALTH` are excluded at the query level, so this only affects `INVESTOR_ONLY`).
- "Investors always see exact figures" is today "any authenticated user with role INVESTOR" — the spec's more precise "after mutual interest" gate (e.g. only after a connect request is accepted) isn't modeled; any investor sees any startup's exact revenue.
- No frontend UI yet for relationship claims, phone verification, or the verification ledger, and no investor-facing UI yet for funding-round history (founder-only add/list/delete exists; only the trust-preview and document-access panels got frontend homes so far).
- `trust-model.ts`'s `decayFactor()` (per-verification age-based decay) exists and is unit-tested but isn't wired into `computeTrust` yet — today a verification is either fully counted or not; a verification aging toward its TTL doesn't yet contribute a fading partial score. Wiring it means changing `TrustSignals` from booleans to decayed weights, which is exactly the kind of model-weight change trust-model.ts's own comments say needs a shadow-mode diff first — deliberately deferred, not missed.
- `deriveOverallStage()` (Bundle 3) is a reasonable v1 heuristic — furthest-progressed axis wins — not a spec-mandated formula; only startups that publish or republish onboarding after this change get product/revenue/funding status populated, existing ones have them `null` until then.
- Document watermarking (spec §21) isn't implemented — the data-room access control (expiry, NDA gate, view log) is real, but the file itself isn't watermarked per-viewer yet; that needs a real media-processing step, not just a permission check.
- Funding round dates/amounts are founder-declared (V1) — the spec's "dates V3-MCA-verified" isn't wired since the MCA provider is still a `PENDING` placeholder (see above).
- `subIndustry` is still free text; a full sub-industry crosswalk under the new `Industry` taxonomy is future work.

## Where the code lives (paths that matter)

- Prisma schema: `apps/api/src/database/prisma/schema.prisma`
- API modules: `apps/api/src/modules/`
- Trust v2 model + tests: `apps/api/src/modules/trust/`
- Phase 0 architecture audit: `docs/audit/`
- CI: `.github/workflows/ci.yml` + `docs/testing/CI.md`

## Honest next milestones

1. **Configure Resend** so real verification emails send.
2. **Click-test the remaining flows** (meetings, community, notifications, admin, jobs, the other actor directories) and fix what breaks.
3. **Deploy** (Vercel + Railway) and connect `vittamhub.com`.
