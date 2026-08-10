# VittamHub — Implementation Status

Living handover document. Written so a fresh Claude session (or a new
engineer) can continue without re-deriving the project state.

**Last updated:** 2026-08-11
**Live:** https://vittamhub.com · API https://api.vittamhub.com
**Repo:** `gourishkumawat9/vittam-hub` (Railway deploys `main` for the API,
Vercel deploys the web app — see "Deployment gotchas").

---

## 1. Verified current state (checked against the schema/code, not assumed)

An earlier written status claimed several things were missing that are in fact
**already built**. Verified directly in `schema.prisma`:

| Previously believed missing | Reality |
|---|---|
| No verification-history table | `VerificationRecord` exists (tier/method/status/expiresAt/rawResponse) |
| No metric history | `MetricObservation` exists — dated, append-only |
| Trust score not persisted | `TrustScoreSnapshot` exists with history + breakdown |
| Money in USD | Zero `*Usd` columns remain; `Currency` enum, INR default |
| Industry free text | `Industry` enum; only `subIndustry` is free text |
| Not deployed | Live, valid TLS, www→apex 308 redirect, HSTS |
| No production email | Resend configured (but see blocker below) |

**Do not rebuild any of the above.**

### Bundles genuinely built (8 of 30)
2 (Company basics), 3 (3-axis stage), 8 (Market), 12 (Funding rounds),
15 (Hiring), 22 (Verification ledger), 28 (Trust score), 30 (Privacy/projection).

### Bundles genuinely missing (11 of 30)
4 (Legal identifiers — **no CIN/GSTIN/DIN/DPIIT fields exist anywhere**),
6 (Technology/GitHub), 9 (Customers), 16 (Partnerships), 17 (Structured IP),
18 (Compliance), 19 (Financial metrics), 20 (Social presence), 23 (AI readiness),
24 (Sustainability), 27 (Exit readiness).

### Partial
5, 7, 10, 11, 13, 14, 21 (data room real, **no watermarking**), 25, 26, 29.

---

## 2. Completed this session

| Change | Files |
|---|---|
| Mobile/default theme forced to light (was following OS → dark) | `apps/web/src/app/providers.tsx` |
| Nav logo 44px → 32/26px responsive (was ~70% of a 64px bar) | `apps/web/src/components/marketing/NavBar.tsx` |
| **New `NextActionsCard`** — answers "what should I do next?" from real trust-engine gaps, routes each action to where it's actioned | `apps/web/src/components/dashboard/founder/NextActionsCard.tsx` (new) |
| Founder dashboard restructured into 3 tiers: Next actions → Your standing → Activity (was 4 flat competing grids); page now titled with the startup's name | `apps/web/src/app/(dashboard)/founder/page.tsx` |
| Onboarding Step 8: per-document benefit copy before the ask, "All optional" badge, honest framing (no overclaiming since registries are stubs) | `.../onboarding/founder-steps/Step8Verification.tsx` |

### Earlier in the same working period (already deployed)
- **Critical MFA bypass fixed** (challenge token was a valid session JWT) + regression test
- Two IDORs fixed (connection meetings; verification ledger leaking `rawResponse` PII)
- CSRF protection (double-submit cookie, global guard)
- Signed, expiring document URLs — revocation now actually revokes
- `trust proxy` set (rate limiting had collapsed into one global bucket = platform-wide lockout DoS)
- Automatic `prisma migrate deploy` via Railway `preDeployCommand`
- Real `/health` probe (Postgres hard-fails; Redis reported, never fatal)
- App-wide toast system + global mutation error handling; ⌘K search
- **Signup no longer 500s when email delivery fails** (was creating the user then throwing, leaving people permanently stuck)

---

## 3. Known bugs / risks

1. **File uploads are broken in production.** `STORAGE_*` (Cloudflare R2) is
   entirely unconfigured. A founder uploading a pitch deck during onboarding
   will fail. **Highest-priority blocker.** Needs Cloudflare credentials.
2. **Verification emails do not arrive.** Resend has no SPF/DKIM published for
   the sending domain, so it only delivers to the account owner's address.
   No route gates on `emailVerifiedAt`, so this does not block app usage.
3. **Neon connections are being dropped** (`terminating connection due to
   administrator command`). `DATABASE_URL` points at the **unpooled** endpoint
   with no `connection_limit`. Fix: switch to the `-pooler` host and add a
   separate `DIRECT_DATABASE_URL` for migrations (the `preDeployCommand`
   depends on that distinction).
4. **No error monitoring.** `SENTRY_DSN` unset on both apps.
5. Redis Cloud free tier **cannot** set `maxmemory-policy` (`CONFIG SET` →
   `ERR Unsupported CONFIG parameter`), so BullMQ's `noeviction` warning is
   permanent on this plan. Currently 3.18MB/30MB — low risk.

---

## 4. Known performance issues (audited, not yet fixed)

- Pipeline board, portfolio, mentors list, workspace dashboard all still N+1.
  (The worst offender — startup search at ~280 queries/page — **is fixed**.)
- ~12 missing DB indexes; highest value: `Startup(isPublic, verificationStatus,
  industry, stage)`, `StartupFollow(startupId, notifyOnUpdate)`,
  `Connection(requesterId, createdAt)`, `Document(userId, type)`.
- Unbounded `findMany` (no `take`) on messages, portfolio, pipeline.
- `relationship-claims.service.ts:132-138` — claim set to CONFIRMED and the
  two `VerificationRecord` rows written **outside** a transaction; a partial
  failure is unrecoverable.

---

## 5. Database

**No migrations were added this session.** Last migration:
`20260725210135_investment_exit_tracking`. 12 total, all applied
(`prisma migrate deploy` confirmed "No pending migrations" on deploy).

---

## 6. Deployment gotchas

- **Railway's GitHub auto-deploy webhook is unreliable.** A `git push` often
  does *not* trigger a build. Force it with:
  `railway service source connect --repo gourishkumawat9/vittam-hub --branch main --service vittamhub-api`
- **Vercel is not git-connected at all.** The web app must be deployed manually
  with `vercel --prod --yes` **from the repo root** (running it from
  `apps/web` fails — Vercel tries `npm install` in a pnpm monorepo).
- `prisma` is intentionally in `dependencies`, not `devDependencies`, so
  `pnpm deploy --prod` keeps the CLI for the migration step.

---

## 7. Architectural decisions worth preserving

- **No manual verification queue, ever** (`CLAUDE.md` §6). Note this
  **contradicts** the spec's Section 10 admin "manual verification queue with
  SLAs" and its V1 tier definition ("admin-reviewed"). *Unresolved — decide
  before building admin verification UI.* V1 currently means "document on
  file, automated check pending."
- Redis is non-essential by design: queue features degrade, the API stays up.
  Do not make `/health` fail on Redis.
- MFA challenge tokens are signed with `JWT_REFRESH_SECRET`, and
  `env.validation.ts` enforces that it differs from `JWT_ACCESS_SECRET`.
  Breaking that re-opens an auth bypass.
- Public profiles must always go through `StartupPublicProjectionService`.

---

## 8. Next exact task

**Configure Cloudflare R2** (`STORAGE_ENDPOINT`, `STORAGE_BUCKET`,
`STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`,
`STORAGE_PUBLIC_CDN_URL`) on Railway, then verify the full document flow
end-to-end: upload → grant → signed URL → revoke → confirm access denied.
The code is written and unit-tested but has **never run against real storage**.

Then, in order:
1. Neon pooler + `DIRECT_DATABASE_URL` (see §3.3).
2. Role dashboards: mentor, incubator, university (founder + investor exist).
3. Admin console (overview, verification monitoring, user management) — build
   the moderation/report **data model** without pretending a fraud engine exists.
4. The four indexes in §4.

---

## 9. Continuation prompt for a new session

> Read `VITTAMHUB_IMPLEMENTATION_STATUS.md` at the repo root first — it has the
> verified current state, known bugs, and deployment gotchas. Do not rebuild
> anything listed as already built. Work on the "Next exact task" section.
> Verify claims against the code rather than trusting any older status doc.
