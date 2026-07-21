# VittamHub — Project Status

_Honest snapshot. No marketing, no fabricated numbers (per CLAUDE.md §2)._
_Last updated: this reflects the state at the most recent push._

## One-paragraph truth

VittamHub is a working full-stack platform (NestJS + Prisma + PostgreSQL + Redis backend, Next.js frontend) that runs **only on the developer's machine right now**. It is **not deployed** — there is no public website, and the registered domain `vittamhub.com` is not connected to anything yet. The backend is proven (APIs tested, 32 auth tests + 16 trust-model tests green, CI pipeline built); most **browser** flows beyond sign-up/login have not yet been click-tested end-to-end.

## Real data in the database

| Thing | Count | Note |
|---|---|---|
| Startups | 1 | "Demo Startup QA" — created during testing, not a real company |
| Users | 8 | all test accounts created during development |
| Real users / real startups | 0 | pre-launch |

## What actually works today

**Verified in a browser (a person can click and use):**
- Public landing / marketing pages (with the official logo + favicon)
- Sign up / create account
- Log in / log out
- Email verification — but the code prints to the server console (real email not configured yet)

**Backend proven via API tests, but not yet click-tested in the browser:**
- Startup onboarding → publish a startup profile
- Investor onboarding → publish an investor profile
- Connect-request core loop (send → accept → message → schedule meeting), gated correctly
- Community (posts / comments / likes / bookmarks), follows, watchlist
- Search, notifications, admin plan-limit editing
- Jobs, and all six actor directories (mentors, incubators, universities, service providers, investors, startups)

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
2. **Click-test the core flows in the browser** (onboarding, dashboards, connect loop) and fix what breaks.
3. **Deploy** (Vercel + Railway) and connect `vittamhub.com`.
