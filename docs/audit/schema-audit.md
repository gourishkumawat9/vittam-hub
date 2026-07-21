# Phase 0 — Schema Audit

Evidence-based reconciliation of the existing Prisma schema (`apps/api/src/database/prisma/schema.prisma`, 48 models) against the target trust/verification/time-series architecture. Read-only; no changes made.

## The six ordered questions (most expensive to get wrong, first)

### Q1 — Are metrics stored as scalar columns? **YES. This is the one irreversible conflict.**

Metrics are mutable, current-value scalar columns updated in place, with **no history, no provenance, no per-observation verification tier, and no projection flag**. Spread across four tables:

| Table | Metric columns |
|---|---|
| `Startup` (L504, L508) | `teamSize`, `fundingRaisedUsd` |
| `StartupTraction` (L624–632) | `monthlyRevenueUsd`, `arrUsd`, `mrrUsd`, `totalUsers`, `totalCustomers`, `downloads`, `retentionRatePercent`, `growthRatePercent` |
| `StartupMarket` (L607–609) | `tamUsd`, `samUsd`, `somUsd` |
| `StartupFunding` (L649–655) | `currentRaiseUsd`, `fundingGoalUsd`, `valuationUsd`, `runwayMonths`, `monthlyBurnRateUsd` |

Each sub-table is 1:1 with `Startup` (`startupId @unique`) and carries a single `updatedAt` — updating MRR overwrites the previous value and its timestamp. **Growth rates, forecast-vs-actual credibility, cohort benchmarks, and watchlist triggers are all impossible on this shape.** This is CONFLICT 3 and it is real. Migration plan in `reconciliation-plan.md §3`.

### Q2 — Is there a first-class `Verification` table with tier/expiry/raw payload? **NO.**

There is **no `Verification` model**. Verification is represented by:
- a single enum `verificationStatus` (`UNVERIFIED | PENDING | VERIFIED | REJECTED`) + `verifiedAt DateTime?` on each entity (`Startup` L510–511, and identically on `Investor`, `MentorProfile`, `IncubatorProfile`, `UniversityProfile`, `ServiceProviderProfile`);
- `Document` uploads (L465);
- `verification-engine.service.ts`, which only recomputes that enum.

No tiers (V0–V3), no `expires_at`, no immutable raw registry payload, no per-claim granularity. This is the "boolean flag wearing a costume" the review predicted. The four-tier verification primitive **must be built new** (additive — see `reconciliation-plan.md §4`).

### Q3 — Does the trust score incorporate completeness (P4 violation)? **YES. Confirmed violation.**

`trust-score.service.ts` injects `ProfileCompletionService` and awards points for typing:

| Factor | Weight | Earned by | P4? |
|---|---|---|---|
| `profileCompletion ≥ 80%` | 10 | typing (completeness) | ❌ **direct violation** |
| `website` | 10 | pasting a URL (no DNS check) | ❌ |
| `linkedin` | 10 | pasting a URL (no match) | ❌ |
| `companyRegistered` | 15 | founder-set enum `registrationStatus==REGISTERED` (no MCA check) | ❌ |
| `productDemo` | 10 | typing `demoVideoUrl` | ❌ |
| `founderDetails` | 5 | typing bio + city | ❌ |
| `timeline` | 5 | adding ≥1 milestone (typed) | ❌ |
| `pitchDeck` | 15 | a `Document` row exists (unreviewed) | ⚠️ V1-ish, uncapped |
| `phoneProvided` | 5 | typing a number (no OTP) | ❌ |
| `emailVerified` | 15 | **actual verification** | ✅ only one |

**A founder can reach ~85/100 by typing.** Only `emailVerified` requires real verification. Bands also diverge from spec: existing `deriveBand` uses `EXCELLENT≥90 / HIGH≥70 / MEDIUM≥40 / LOW` vs spec `Platinum85 / Gold65 / Silver45 / Bronze25 / Starting`. This is CONFLICT 2; resolution in `reconciliation-plan.md §2` (three scores, strangler migration).

### Q4 — Industry: free text, enum, or tree? **Free text.**

`Startup.industry String` (L491), `Startup.subIndustry String?` (L492), `Investor.preferredIndustries String[]` (free text). No taxonomy, no controlled vocabulary. This is the Tracxn anti-pattern the research explicitly warns against — free-text industry destroys matching and market maps. The 6-axis `taxonomy_nodes` tree must be built; `industry`/`subIndustry` become FKs (additive, with a backfill/normalization pass).

### Q5 — Field visibility: per-field, per-section, or absent? **Whole-profile boolean only.**

The only control is `isPublic Boolean` per entity (`Startup` L512; same on all six profile types). No per-field, section, `investor_gated`, `nda_gated`, or `private` visibility, and no `field_visibility_overrides`. The permission/visibility surface in the spec (§10, §11) does not exist and must be built. Impact: the "diligence layer" gating (§12.2 band 4) has no enforcement primitive today.

### Q6 — Extensions + Postgres version? **PG 16.14; all needed extensions AVAILABLE.**

```
server_version : 16.14
AVAILABLE      : ltree, pg_trgm, postgis, vector   ← all present on Neon
INSTALLED      : plpgsql                            ← the rest need CREATE EXTENSION
```

**The two-plane analytical layer is fully supported on the existing Neon instance** — pgvector (HNSW), ltree (taxonomy), PostGIS (geography) all just need enabling. No infrastructure migration required. This de-risks the entire analytical plane.

## Model classification (48 models)

**KEEP — no change (35):** all auth/identity (`User`, `UserProfile`, `OAuthAccount`, `RefreshToken`, `OtpCode`, `PasswordResetToken`, `MfaRecoveryCode`), `StartupMilestone`, `StartupTeamMember`, `StartupProduct`, `StartupPreference`, `Job`, `JobApplication`, `MentorProfile`, `IncubatorProfile`, `IncubatorProgram`, `MentorBookingRequest`, `FounderReview`, `UniversityProfile`, `ServiceProviderProfile`, `JobSeekerProfile`, `WorkExperienceEntry`, `EducationEntry`, `Connection`, `Meeting`, `StartupFollow`, `Follow`, `StartupProfileView`, `PipelineEntry`, `Message`, `PlanLimit`, `Notification`, community (`Post`, `Comment`, `Like`, `PostBookmark`, `PollOption`, `PollVote`, `EventRsvp`), `Subscription`.

**EXTEND — additive columns/relations (5):**
| Model | Extension |
|---|---|
| `Startup` | add `product_status` / `revenue_status` / `funding_status` axes + `declared_stage`/`verified_stage` (§Conflict 1); `industry`→taxonomy FK |
| `StartupMarket` | keep TAM/SAM/SOM as descriptive; move nothing urgent |
| `Investor` | extract embedded mandate → `investor_mandates` (multiple); add thesis embedding link |
| `Investment` | add `confirmation_status` for two-sided confirmation; relate to `funding_rounds` |
| `AuditLog` | consider per-field granularity for `field_audit` |

**CONFLICT — needs migration (3):** `StartupTraction`, `StartupFunding` (metric scalars → `metric_observations`, Q1), and `Startup.stage` (conflated enum → decomposed axes, Q3/Conflict 1).

**Notable divergence (not a conflict):** the spec specified a **polymorphic `organizations` table**; the repo instead uses **typed per-actor profile tables** (`Investor`, `MentorProfile`, `IncubatorProfile`, `UniversityProfile`, `ServiceProviderProfile`, `JobSeekerProfile`). This is a valid alternative and arguably cleaner in Prisma — **recommend keeping the typed-table approach, not forcing polymorphism.** Five of the six target actor types already exist; only **government organization** is missing (accelerator ≈ `IncubatorProfile`).

## Tables that must be built new (analytical plane — all additive)

`verifications` · `metric_definitions` · `metric_observations` (partitioned) · `metric_current` (matview) · `trust_scores` (append-only, versioned) · `taxonomy_nodes` (ltree, 6 axes) · `startup_classifications` · `startup_embeddings` (pgvector) · `matches` + `match_events` · `investor_mandates` · `funding_rounds` + `round_participants` + `raise_intents` + `cap_table_summary` · `bundle_definitions` (benefit copy `NOT NULL`) + `bundle_completions` · `integrations` (OAuth tokens, encrypted) · `document_grants` + `document_access_log` · `field_visibility_overrides` · `badges` + `badge_awards`. Plus the `field-registry` and `taxonomy` packages.

**None of these overwrite existing models. The entire analytical plane is additive.**
