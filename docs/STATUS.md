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
| Startups | 1 | "Demo Startup QA" — created during testing, not a real company |
| Users | 8 | all test accounts created during development |
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
| Database (Neon PostgreSQL, Singapore) | live, 49 tables, migrated + seeded |
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

## Known issues / honest caveats

- **P4 violation in the *current* trust score:** the live scorer awards points for typing (website, LinkedIn, profile completeness). A verification-only v2 model + comparison harness now exist (`apps/api/src/modules/trust/`); the fix folds into v2. No impact today (1 demo startup, no audience).
- Metrics are stored as overwrite-in-place columns (no history) — flagged for migration to time-series observations.
- `industry` is free text; a taxonomy is planned.

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
