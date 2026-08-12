# VittamHub — Technical Handoff

Every claim here was verified against the code or the live production
database. Where something could not be verified, it says so. Read
`docs/architecture/05-current-state.md` alongside this — it is the deeper
architectural audit; this file is the operational handoff.

**Live:** https://vittamhub.com · API https://api.vittamhub.com
**Repo:** `gourishkumawat9/vittam-hub` (branch `main`)

---

## A. What the website does

A trust-first startup ecosystem platform for India. Founders publish a verified
startup profile; investors discover and evaluate them; mentors, incubators,
universities and service providers participate as separate verified actors.

The product's defining rule: **a Trust Score rises only through verification,
never by typing text.** Everything else follows from that.

**Users:** Founders · Investors · Mentors · Incubators/Accelerators ·
Universities · Service Providers · Job Seekers · Admin.

**Core loop (enforced in code, `CLAUDE.md` §4):** a founder can *never* message
an investor directly. They send a **Connect Request**; only after the investor
accepts do messaging, document sharing and meeting scheduling unlock.

---

## B. Technology stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS 10 (TypeScript), `apps/api` |
| Frontend | Next.js 14 App Router, `apps/web` |
| Database | PostgreSQL on Neon, Prisma 5.22 |
| Cache/Queues | Redis Cloud + BullMQ |
| Auth | Passport JWT in **httpOnly cookies** (not localStorage) + Google OAuth |
| Validation | Zod, shared between client and server via `packages/types` |
| Styling | Tailwind + a bespoke design system (`packages/ui`, `packages/tokens`) |
| Email | Resend |
| Storage | Cloudflare R2 (S3-compatible) — **not configured, see §K** |
| Hosting | Vercel (web) · Railway (API) |
| Node | 20.11 (`.nvmrc`), pnpm 9.12 |

**There is no shadcn/ui.** The design system is hand-built on Radix primitives.
Do not introduce shadcn — it would duplicate and fight the token system.

---

## C. Folder structure

```
apps/
  api/                     NestJS backend
    src/
      main.ts              bootstrap: helmet, cookie-parser, CSRF cookie,
                           trust proxy, CORS, global pipes, Swagger (non-prod)
      app.module.ts        global guards: Throttler → Csrf → JwtAuth → Roles
      app.controller.ts    /health (probes Postgres hard, Redis soft)
      common/              guards, decorators, filters, interceptors, pipes
      config/env.validation.ts   Zod env schema — fails fast at boot
      database/prisma/     schema.prisma + 12 migrations + PrismaService
      modules/             31 controllers, one folder per domain
  web/                     Next.js frontend
    src/
      app/(marketing)/     public pages
      app/(auth)/          login, register, verify-email, reset-password
      app/(dashboard)/     authenticated app — 36 routes
      middleware.ts        edge auth gate (cookie presence only)
      components/          feature components
packages/
  types/                   Zod schemas + TS types — the shared contract
  api-client/              typed fetch wrappers + React Query hooks
  ui/                      design system primitives
  tokens/                  design tokens → Tailwind preset
  utils/                   money/date/pagination helpers
  config/                  shared eslint/ts config
infra/docker/api.Dockerfile   multi-stage build used by Railway
docs/architecture/05-current-state.md   deep audit — READ THIS
VITTAMHUB_IMPLEMENTATION_STATUS.md      status + continuation prompt
NOTES.md                                parked out-of-scope findings
```

---

## D. Page / route map

**Public:** `/` · `/about` · `/pricing` · `/startups/[slug]` · `/investors` ·
`/mentors/[id]` · `/incubators/[id]` · `/universities/[id]` ·
`/service-providers/[id]` · `/jobs` · `/search` · `/learning`

**Auth:** `/login` · `/register` · `/verify-email` · `/forgot-password` ·
`/reset-password`

**Onboarding:** `/onboarding/{founder,investor,mentor,incubator,university,service-provider,job-seeker}`
— a 10-step wizard for founders with autosaved drafts.

**Authenticated (36 routes)** under `app/(dashboard)/`:
- Founder: `/founder`, `/founder/analytics`, `/founder/documents`, `/founder/hiring`
- Investor: `/investor` + `/discover`, `/pipeline`, `/portfolio`, `/mandates`,
  `/watchlist`, `/saved-searches`, `/co-investors`, `/analytics`, `/requests`,
  `/messages`, `/meetings`, `/documents`, `/recommendations`, `/settings`, `/profile`
- Shared: `/connections/[id]`, `/community`, `/mentors`, `/mentors/bookings`,
  `/incubators`, `/universities`, `/service-providers`, `/jobs`, `/admin`

**Access control is two-layer:**
1. `apps/web/src/middleware.ts` — edge redirect on **cookie presence only**.
   Protects `/founder`, `/investor`, `/admin`. It is *not* the security
   boundary; it exists so unauthenticated users get a redirect, not a flash.
2. The API — real enforcement. `JwtAuthGuard` + `RolesGuard` globally.

---

## E. API map

**170 endpoints across 31 controllers** (85 GET, 56 POST, 15 PATCH, 14 DELETE),
all under `/v1/*`. Authenticated by default; `@Public()` opts out.

Auth (`/v1/auth`): `register` · `login` · `mfa/challenge` · `refresh` ·
`logout` · `me` · `verify-email/{resend,confirm}` ·
`password/{forgot,reset,change}` · `mfa/{enroll,enroll/confirm,disable}` ·
`sessions` (list/revoke) · `captcha-site-key` · `csrf` ·
`{google,github,linkedin}` + `/callback`

Other domains: `startups` · `investors` · `onboarding` · `connections` ·
`documents` · `media` · `verification` · `trust` · `relationships` ·
`mentors` · `incubators` · `universities` · `service-providers` ·
`pipeline` · `portfolio` · `watchlist` · `saved-searches` · `mandates` ·
`workspace` · `analytics` · `notifications` · `community` · `follows` ·
`search` · `hiring` · `plan-limits` · `admin` · `billing` (Stripe webhook).

**Response envelope:** every response is wrapped by `TransformInterceptor` as
`{ data, requestId }`; errors as `{ error: { code, message, requestId } }`.
The client unwraps `.data` in `packages/api-client/src/http.ts`.

---

## F. Database schema

**57 tables, 12 migrations.** Key models and relationships:

- `User` 1–1 `UserProfile`; 1–many `OAuthAccount`, `RefreshToken`, `OtpCode`
- `User` **1–1** `Startup` / `Investor` / `MentorProfile` / `IncubatorProfile` /
  `UniversityProfile` / `ServiceProviderProfile` — via `ownerId @unique`
  ⚠️ **This unique constraint means one person can own at most one startup.**
  It silently forbids serial founders. See §M.
- `Startup` 1–1 `StartupProduct`/`Market`/`Traction`/`Funding`/`Preference`;
  1–many `StartupTeamMember`, `StartupMilestone`, `FundingRound`,
  `MetricObservation`, `Job`, `Post`
- `Connection` (founder→investor) 1–many `Message`, `Meeting` — the core loop
- `Document` 1–many `DocumentGrant` (per-viewer, expiry, NDA) + `DocumentView`
- `VerificationRecord` — **polymorphic** (`entityType`/`entityId`/`field`).
  Targets a *claim*, not a document. Stores tier/method/status/expiresAt/rawResponse
- `RelationshipClaim` — polymorphic two-sided confirmation
- `TrustScoreSnapshot` — polymorphic score history with JSON breakdown
- `MetricObservation` — dated, append-only metric history (never overwritten)

Money: `Decimal(14,2)` **major units** + a `Currency` enum (INR default).
Industry: `Industry` enum (28 values); `subIndustry` is still free text.

---

## G. Authentication flow

```
register/login → argon2 verify → (MFA challenge if enabled)
  → access JWT (15m) + opaque refresh token (48 random bytes, SHA-256 hashed)
  → both set as httpOnly cookies (secure in prod, SameSite=lax)
→ every request: JwtStrategy reads the cookie, validates the payload shape
→ /refresh rotates the refresh token (old one revoked)
→ logout revokes it server-side and clears cookies
```

Deliberate decisions worth preserving:
- **Cookies, not localStorage** — immune to XSS token theft. Trade-off is CSRF,
  which is handled by a double-submit cookie (`CsrfGuard`).
- **MFA challenge tokens are signed with `JWT_REFRESH_SECRET`, not the access
  secret**, and `JwtStrategy.validate` rejects any token carrying a `purpose`
  claim. Both layers exist because collapsing them re-opens a real auth bypass
  (see §J.1). `env.validation.ts` enforces the two secrets differ.
- **`@Public()` routes still do soft auth** — a valid token populates
  `request.user`, an invalid one is ignored. This is how a public startup
  profile knows whether the viewer is an investor.

---

## H. Feature flows

**Founder:** signup → 10-step wizard (autosaved) → publish → dashboard
(Next actions → Your standing → Activity) → discover investors → connect
request (quota-limited) → messaging on accept.
*Only steps 1–2 are required to publish.* Everything else is optional and only
affects Trust Score.

**Investor:** signup → mandates → discovery/search → startup profile (filtered
projection, never the raw row) → watchlist/pipeline → accept connect →
message → portfolio.

**Documents (data room):** upload → grant per-investor (14-day default expiry,
optional NDA) → viewer calls `GET /v1/documents/:id/access` → grant checked →
**5-minute signed URL minted** → view logged. Revocation genuinely revokes.

**Trust:** v1 (`startups/trust-score.service.ts`) is what users see. v2
(`trust/trust-model.ts` + `trust-engine.service.ts`) runs in shadow mode behind
`FF_TRUST_V2`, recomputed nightly at 03:00 UTC by a BullMQ job.

---

## I. Bugs found (all verified from code/logs, not guessed)

| # | Severity | Bug |
|---|---|---|
| 1 | **Critical** | MFA bypass — challenge token was a valid session JWT |
| 2 | **Critical** | API dead 2 days: one failed `$connect()` aborted boot, 3 restart retries exhausted in seconds |
| 3 | **Critical** | Signup 500'd *after* creating the user when email failed → user stuck, "email already exists" on retry |
| 4 | **High** | Data-room revocation did nothing — permanent public CDN URLs |
| 5 | **High** | IDOR: `GET /connections/:id/meetings` had no caller check |
| 6 | **High** | IDOR: verification ledger returned `rawResponse` (registry PII) to anyone |
| 7 | **High** | No CSRF protection on cookie auth |
| 8 | **High** | Storage failed **open** — unset `STORAGE_*` produced a valid-looking URL to `s3.auto.amazonaws.com`; user files POSTed to an unrelated host |
| 9 | **High** | Publishing blocked on *skipped* optional steps, violating the product's own Rule 3 |
| 10 | **Medium** | Rate limiting collapsed to one global bucket (no `trust proxy`) → one attacker could lock out every user |
| 11 | **Medium** | Stealth/private startups leaked via `/milestones` and `/activity` |
| 12 | **Medium** | Password-reset 500 leaked whether an account existed |
| 13 | **Medium** | Reset links + phone OTPs written to production logs |
| 14 | **Medium** | Trust score: 19/100 points reachable by typing (violates the founding rule) |
| 15 | **Medium** | Search issued ~280 queries + 20 writes per page; reads triggered writes |
| 16 | **Medium** | Migrations never ran on deploy |
| 17 | **Medium** | `www` served the apex certificate → cert error |
| 18 | **Low** | No required-field markers anywhere in the wizard |
| 19 | **Low** | No success/error feedback on any of 38 mutation sites |

---

## J. Bugs fixed — with the reasoning worth keeping

1. **MFA bypass.** The challenge token returned by `login` *before* the second
   factor was signed with `JWT_ACCESS_SECRET`, and `JwtStrategy.validate`
   returned the payload unchecked — so it could be replayed as the session
   cookie. An attacker with only a stolen password had a full session.
   Fixed in two independent layers, penetration-tested in production with the
   real secrets: forged token → 401, valid session → 200.
2. **Boot resilience.** `$connect()` now retries 5× with backoff (~15s, covering
   Neon's serverless cold start); restart retries 3 → 10.
3. **Signup.** Verification email is now best-effort; the account is created
   regardless. Same fix applied to password reset, where the 500 additionally
   leaked account existence.
4. **Signed document URLs**, 5-minute TTL, minted only after the grant check.
5–6. **Both IDORs** — ownership checks added; ledger now returns a badge-shaped
   projection to non-owners.
7. **CSRF** — double-submit cookie, global guard, `@SkipCsrf()` only on the
   signature-verified Stripe webhook.
8. **Storage fails closed** — 503 naming the missing variables.
9. **Publish leniency** — only Personal details + Startup info are required.
10. **`trust proxy` = 1** — deliberately the hop count, *not* `true`, which
    would let a client spoof `X-Forwarded-For` and bypass throttling entirely.
11–13. Visibility gate extracted and shared; enumeration leak closed; secrets
    no longer logged in production.
14. **D3 cleanup** — removed `companyDepth` (10), `profileLive` (5),
    `productBundleComplete` (4), plus two engine signals reading typed input.
15. Removed read-triggered writes; batched match scoring.
16. `prisma migrate deploy` as a Railway `preDeployCommand` — chosen over `CMD`
    because it runs once per deploy and a failure aborts the rollout with the
    old version still serving.
17. `www` added to Vercel, 308 → apex, HSTS added.
18–19. Required-field markers (`aria-required` + red asterisk); app-wide toast
    system with a single `MutationCache.onError` covering all 38 sites at once.

**Test suite: 70 unit tests, 9 suites, all passing.** Typecheck + lint clean
across all 8 packages.

---

## K. Remaining bugs / blockers

**Blocked on credentials only you can provide:**
1. **Object storage unconfigured → all uploads fail.** Needs an R2 bucket, API
   token, five `STORAGE_*` vars on Railway, **and a CORS policy on the bucket**
   (the browser uploads directly — without it every upload fails opaquely).
   The signed-URL code is written and unit-tested but **has never run against
   real storage**.
2. **Email only delivers to the account owner** — no SPF/DKIM published for the
   sending domain.
3. **All 9 government registries are `PENDING` stubs.** V3 verification is not
   live. Only work-domain-email and phone OTP verify for real.

**Not blocked — real work remaining:**
4. `DATABASE_URL` is **unpooled**, no `DIRECT_DATABASE_URL`. Contributed to the
   2-day outage and caps you at one replica.
5. **No error monitoring** (`SENTRY_DSN` unset both sides).
6. N+1 queries remain in pipeline, portfolio, mentors, workspace.
7. ~12 missing indexes; highest value:
   `Startup(isPublic, verificationStatus, industry, stage)`,
   `StartupFollow(startupId, notifyOnUpdate)`, `Connection(requesterId, createdAt)`,
   `Document(userId, type)`.
8. `relationship-claims.service.ts:132-138` — claim set CONFIRMED and its two
   `VerificationRecord` rows written **outside a transaction**; partial failure
   is unrecoverable.
9. Unbounded `findMany` (no `take`) on messages, portfolio, pipeline.
10. Mentor / incubator / university have profiles but **no dashboards**.
11. `apps/web` has **zero tests**; `turbo run test` fails there on "no test
    files", which masks real failures in CI output.

---

## L. Files modified this session

Backend: `auth.service.ts` · `auth.controller.ts` · `jwt.strategy.ts` (+spec) ·
`password-reset.service.ts` · `prisma.service.ts` · `main.ts` · `app.module.ts` ·
`app.controller.ts` · `env.validation.ts` · `csrf.guard.ts` (+spec) ·
`csrf-cookie.middleware.ts` · `skip-csrf.decorator.ts` · `media.service.ts` (+spec) ·
`documents.service.ts` (+spec) · `document-access.service.ts` (+spec) ·
`connections.{service,controller}.ts` · `verification-orchestrator.service.ts` ·
`verification.controller.ts` · `startups.controller.ts` ·
`startup-public-projection.service.ts` · `trust-{model,engine,compare}.ts` (+spec) ·
`trust-score.service.ts` · `startup.publisher.ts` (+spec) · `email.service.ts` ·
`sms.service.ts` · `system-health.service.ts` (new) · `admin.{module,controller}.ts` ·
`{trust-recompute,watchlist-trigger}.processor.ts` · `redis-circuit-breaker.ts` (new)

Frontend/shared: `providers.tsx` · `Toast.tsx` (new) · `Input/Select/Textarea` ·
`GlobalSearch.tsx` · `NavBar.tsx` · `NextActionsCard.tsx` (new) ·
`SystemHealthCard.tsx` (new) · `founder/page.tsx` · `admin/page.tsx` ·
`investor/{requests,documents}/page.tsx` · `Step2StartupInfo.tsx` ·
`Step8Verification.tsx` · `http-client-setup.ts` (new) · `next.config.mjs` ·
`packages/types/domain/{document,startup-onboarding,admin}.ts` ·
`packages/api-client/{http,endpoints,hooks}` · `railway.json` · `package.json`

---

## M. Dependencies & N. Environment

**Install:** `pnpm install` (pnpm 9.12, Node 20.11).
Added this session: `@radix-ui/react-toast`. `prisma` was moved from
devDependencies → **dependencies** on purpose, so `pnpm deploy --prod` keeps the
CLI for the migration step. Do not move it back.

**Required (API):** `DATABASE_URL` · `SHADOW_DATABASE_URL` · `REDIS_URL` ·
`JWT_ACCESS_SECRET` · `JWT_REFRESH_SECRET` (**must differ** — enforced) ·
`APP_URL` · `API_URL` · `PORT` · `NODE_ENV` · `RESEND_API_KEY` + `EMAIL_FROM`
(required in production).
**Optional but feature-gating:** `GOOGLE_CLIENT_ID/SECRET` · `STORAGE_*` (5) ·
`CAPTCHA_SECRET_KEY` · `SENTRY_DSN` · registry `*_API_KEY`s.
**Web:** `NEXT_PUBLIC_API_URL`.

Never commit real values. `.env.example` documents the shape.

---

## O. How to run

```bash
pnpm install
pnpm --filter @vittamhub/api db:generate     # generate Prisma client
pnpm --filter @vittamhub/api db:migrate      # apply migrations (dev)
pnpm dev                                      # web :3000 + api :4000
```

Individually: `pnpm dev:api` · `pnpm dev:web`.
Checks: `pnpm typecheck` · `pnpm lint` · `pnpm test` (API only — web has none).

**Deploy gotchas that will waste your time otherwise:**
- Railway's GitHub webhook is unreliable. Force a build with
  `railway service source connect --repo gourishkumawat9/vittam-hub --branch main --service vittamhub-api`
- **Vercel is not git-connected.** Deploy with `vercel --prod --yes` **from the
  repo root** — running it inside `apps/web` fails, because Vercel then tries
  `npm install` in a pnpm monorepo.

---

## P. How to test

```bash
pnpm typecheck && pnpm lint && pnpm --filter @vittamhub/api test
```

Manual sequence (works against production today):
1. `/register` → pick Founder → complete steps 1–2 → **publish** (steps 3–10
   should be skippable — that is the fix for the old "Team details is
   incomplete" dead end).
2. `/founder` → confirm Next actions, Your standing, Activity render with real
   data or clean empty states.
3. `/login` with a wrong password → expect a toast, not silence.
4. Visit `/founder` logged out → expect a 307 to `/login?redirectTo=…`.
5. `POST /v1/auth/login` without an `X-CSRF-Token` header → expect **403**;
   with the matching header and bad credentials → **401** (proves CSRF isn't
   blocking real auth).
6. Uploads will fail with a 503 naming the missing `STORAGE_*` vars. That is
   correct current behaviour, not a regression.

---

# PROMPT FOR THE NEXT AI

> You are taking over **VittamHub**, a production startup–investor platform for
> India. It is deployed and working: https://vittamhub.com (Vercel) and
> https://api.vittamhub.com (Railway). Do not rebuild it.
>
> **Read these three files first, in this order, before touching anything:**
> `HANDOFF.md` (operational handoff), `docs/architecture/05-current-state.md`
> (verified architectural audit), `NOTES.md` (parked findings). Also read
> `CLAUDE.md` — it contains binding product rules.
>
> **Stack:** pnpm/Turborepo monorepo. `apps/api` NestJS 10 + Prisma 5 +
> PostgreSQL (Neon) + Redis/BullMQ. `apps/web` Next.js 14 App Router.
> `packages/{types,api-client,ui,tokens,utils}` shared. Auth is Passport JWT in
> **httpOnly cookies** with a double-submit CSRF cookie. Node 20.11, pnpm 9.12.
>
> **Critical context that will otherwise mislead you:**
> - **Production is nearly empty**: 14 users (all test accounts), 1 startup, 0
>   investors, 0 documents, 0 money values. Structural changes are cheap *right
>   now*. That window closes when real founders sign up.
> - `apps/api/.env` points at a **different Neon project** than production. Do
>   not confuse them. Older docs claiming "16 startups / 43 users" describe dev.
> - Several older status documents are **out of date**. The code is the source
>   of truth. `VerificationRecord`, `MetricObservation`, `TrustScoreSnapshot`,
>   the INR migration and the `Industry` enum all already exist — do not rebuild
>   them.
>
> **Do NOT change these — each encodes a real fix or rule:**
> - MFA challenge tokens are signed with `JWT_REFRESH_SECRET`, and
>   `JwtStrategy.validate` rejects tokens carrying a `purpose` claim. Collapsing
>   either layer re-opens a verified authentication bypass.
> - `app.set("trust proxy", 1)` — the hop count, never `true`.
> - `/health` must fail on Postgres but **never** on Redis; queue features
>   degrade by design.
> - Document reads go through `DocumentAccessService.access()`, which mints a
>   short-lived signed URL. Never return `Document.fileUrl`.
> - Public startup data always goes through `StartupPublicProjectionService`.
> - `prisma` stays in `dependencies`, not devDependencies.
> - No admin manual-verification queue — `CLAUDE.md` §6 forbids it.
> - The Trust Score must never award points for typed text or completeness.
> - No shadcn/ui — there is an existing design system in `packages/ui`.
>
> **Blocked on credentials the owner must supply:** Cloudflare R2 (all uploads
> currently fail — needs 5 `STORAGE_*` vars **and** a bucket CORS policy),
> SPF/DKIM for email, and all 9 government registry API keys (V3 verification
> is not live).
>
> **Suggested next tasks, highest value first:**
> 1. Configure R2 and verify the full document flow end-to-end against real
>    storage: upload → grant → signed URL → revoke → confirm access denied.
> 2. Switch `DATABASE_URL` to Neon's pooled endpoint and add
>    `DIRECT_DATABASE_URL` for migrations (`preDeployCommand` depends on the
>    distinction).
> 3. Add `SENTRY_DSN` to both apps.
> 4. Add the four missing indexes listed in `HANDOFF.md` §K.
> 5. Build mentor / incubator / university dashboards (backends exist; reuse
>    `MentorBookingRequest`, `MentorReview`, `IncubatorProgram`,
>    `RelationshipClaim` — do not create new models).
>
> **Working style expected:** verify claims against the code before acting;
> never fabricate data or metrics; preserve existing architecture; run
> `pnpm typecheck && pnpm lint && pnpm --filter @vittamhub/api test` after every
> change; and state plainly what you could not verify.
