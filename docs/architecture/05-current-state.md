# Brief 00 — Codebase Audit: Current State

**Read-only audit.** No application file, schema or config was modified.
Every claim below was checked against the code or the live database; anything
I could not determine says so.

**Headline:** production holds **1 startup and 0 investors**. The migration
risk the architecture docs are written around does not exist yet. That single
fact should reorder the entire plan — see §5.

---

## 1. Inventory

### 1.1 Subjects and identity

| Question | Finding |
|---|---|
| Single `Startup`-like model carrying founder + entity + venture? | **Yes.** `Startup` (schema.prisma:722) carries venture identity, entity facts (`registrationStatus`, `companyType`), stage, money and visibility in one row. |
| Separate `Person`/`Organisation`/`Venture`? | **Person: partial** — `User` + `UserProfile` exist and are genuinely separate. **Organisation: absent.** **Venture: absent** (it *is* `Startup`). |
| Can one person link to two startups? | **No.** `Startup.ownerId` is `@unique` (schema.prisma:723). One user → at most one startup, enforced at the DB level. Same pattern on `Investor` (1004), `MentorProfile` (1069), `IncubatorProfile` (1093). |
| Roles modelled with dates? | **No.** Ownership is a single `ownerId` column with no start/end. `StartupTeamMember` has `createdAt` only — no role period, no departure. |

`Idea` as a first-class subject: **absent.** `StartupStage.IDEA` is an enum value
on a Startup row, not a distinct subject. An idea today must create a full
Startup record.

### 1.2 Identifiers

**None of CIN, LLPIN, PAN, GSTIN, DIN, DPIN, Udyam, DPIIT number, BHASKAR ID or
LEI is stored as a field anywhere in the schema.** Verified by grep across
`schema.prisma`: the only hits are (a) `DocumentType.PAN` /
`DocumentType.DPIIT_RECOGNITION` — document *categories*, not values — and (b)
illustrative strings inside `VerificationRecord` column comments.

Consequences:
- Columns vs identifier table: **neither exists.**
- Format validation / checksum: **absent** — there is nothing to validate.
- Uniqueness constraint: **absent.** Two startups could claim the same company.
- Cross-validation (GSTIN-embedded PAN vs stored PAN): **absent.**

This is the largest single gap against the architecture docs.

### 1.3 Verification

`VerificationRecord` **exists** (schema.prisma:1747). Full column list:

`id · entityType · entityId · field · tier · method · status · verifiedAt ·
expiresAt · verifiedBy · confidence · rawResponse · createdAt · updatedAt`

- **Targets a claim, not a document** — `field` holds `"legalName"`, `"gstin"`,
  `"portfolioCompany:<startupId>"`. This already satisfies **D2**, and does so
  better than the docs assume. It is polymorphic via `entityType`/`entityId`
  rather than FK-constrained.
- Stores tier, method, `verifiedAt`, `expiresAt`, `verifiedBy`, `confidence`,
  and `rawResponse` (permanent audit copy). `checked_at` as distinct from
  `verifiedAt`: **absent** — a failed check records no timestamp of its own.
- **States: 5** — `PENDING · VERIFIED · FAILED · EXPIRED · DISPUTED`.
- **`unable_to_verify` is NOT distinguishable from `failed` (D6 violated).**
  There is no such state. In practice unverifiable-by-nature currently lands in
  `PENDING` (all nine registry stubs return `PENDING` when unconfigured), which
  conflates "no API key configured", "not yet attempted" and "structurally
  unverifiable" into one bucket.
- Separate evidence/artifact table: **absent.** `Document` exists but is not
  linked to `VerificationRecord` by FK — `rawResponse` is the only evidence.
- **Admin review queue: deliberately absent**, and correctly so —
  `CLAUDE.md` §6 forbids it. Note this contradicts the *spec's* Section 10 and
  its V1 tier definition ("admin-reviewed"); see §3.

### 1.4 Scoring

`TrustScoreSnapshot` **exists** (schema.prisma:1793) with `score · band ·
breakdown(Json) · computedAt`, polymorphic by `entityType`/`entityId`. It is
**written to for real** — by `TrustRecomputeProcessor` on a daily 03:00 UTC
BullMQ job. (A second write path on every *read* was removed this week; it was
making the table grow with read traffic.)

Scoring lives in two services plus a pure model:
`trust-model.ts` (pure, unit-tested, 9 components summing to 100),
`trust-engine.service.ts` (v2, gathers signals), and a separate legacy
`startups/trust-score.service.ts` (v1 — **this is what users actually see**).
v2 remains shadow-mode behind `FF_TRUST_V2`.

- Components/breakdown stored: **yes**, as JSON per snapshot.
- `rubric_version`: **partial** — `TrustV2Preview.version` exists in the API
  response, but the snapshot row itself has no version column, so historical
  scores cannot be attributed to a rubric. Reproducibility is not guaranteed.

**D3 — does any scoring path award points for typed text? Yes. Up to 19 of 100.**

```ts
// trust-model.ts:121
Math.max(0, Math.min(1, s.companyDepth)) * 10,
```

fed by:

```ts
// trust-engine.service.ts:142-148
const structuredCompanyFields = [
  startup.registrationStatus === "REGISTERED",   // a dropdown, unverified
  !!startup.companyType,                          // a dropdown
  !!startup.headquarters,                         // free text
  !!startup.foundedYear,                          // a typed number
];
const companyDepth = structuredCompanyFields.filter(Boolean).length / structuredCompanyFields.length;
```

None of the four is verified against anything. A founder selecting
"Registered", picking a company type, and typing a city and a year earns the
full 10 points. The code comment calls these "structured, verifiable company
facts… never free-text length" — *structured* is true, *verified* is not, and
D3 draws the line at verification, not at structure.

Two further violations of the same rule in the same function:
- `profileLive ? 5` (trust-model.ts:120) — 5 points for publishing.
- `productBundleComplete ? 4` (:123) — 4 points for filling in a bundle, i.e.
  completeness entering the index, which D3 says must be displayed separately.

### 1.5 Metrics and money

- `MetricObservation` **exists and is used** — dated, append-only
  (`metricKey · value · currency · periodStart · source · verificationTier`).
  Written on traction publish/update. **D-metric-history is satisfied.**
- `StartupTraction` still holds overwrite-in-place current values alongside it.
  Both exist; the snapshot table is not yet the sole source of truth.
- **Money is `Decimal` major units, not `amount_minor`.** e.g.
  `fundingRaisedAmount Decimal @db.Decimal(14,2)`, paired with a `currency`
  enum column (`INR | USD`, default `INR`). **D18 partially violated:** there
  is no `as_of_date`, no `fx_rate`, no `fx_rate_date`, and the historical
  USD→INR migration was a `RENAME COLUMN` (`*Usd` → `*Amount`) that preserved
  no original. **Actual exposure is nil — see §4.**
- Industry: **controlled list.** `Industry` enum, 28 values. `subIndustry`
  remains free text (schema comment acknowledges the crosswalk is future work).

### 1.6 Relationships

`RelationshipClaim` **exists and two-sided confirmation is implemented, not
merely modelled** — `RelationshipClaimsService` gates `CONFIRM`/`DENY` to the
claimed-about party and writes a V2 `VerificationRecord` for *both* sides on
confirmation. It is generic over `claimantType`/`targetType`
(Investor · IncubatorProfile · UniversityProfile · Startup) with a
`RelationshipType` enum. **D14 satisfied.**

Confirmation weight scaling by confirmer depth/account age (D14, second
sentence): **absent** — a confirmation is currently binary.

Duplication candidates — separate per-type tables that overlap this concept:
`Investment`, `StartupFollow`, `PipelineEntry`, `MentorBookingRequest`. None is
strictly redundant today (each carries its own workflow state), but
`Investment` and a confirmed `RelationshipClaim` of type portfolio-investment
express the same fact in two places.

### 1.7 Documents and privacy

- `DocumentGrant` **exists** with `expiresAt`, `requireNda`, `ndaAcceptedAt`,
  `revokedAt`. `DocumentView` **exists** as an append-only view log. Access is
  funnelled through one path that checks grant validity then mints a
  **5-minute signed URL** (fixed this week — it previously returned a permanent
  public URL, so revocation did nothing).
- Visibility levels: **4** — `ProfileVisibility` = PUBLIC · INVESTOR_ONLY ·
  PRIVATE · STEALTH, plus an orthogonal `MetricVisibility` = EXACT · BAND ·
  HIDDEN.
- **Consent record: absent. Retention policy: absent. Erasure path: partial** —
  `deletedAt` soft-delete columns exist on User/Startup/Investor; no hard
  erasure, no cascade policy, no DPDP-shaped consent artifact. **D15 and D16
  are entirely unimplemented.**
- Idea / draft / pre-incorporation profile: **partial** — an onboarding draft
  (`UserProfile.onboardingDraft`, JSON) exists, but there is no published
  pre-incorporation subject. `Document` has no watermarking (Bundle 21).

### 1.8 Jurisdiction

**No concept of jurisdiction or country exists on any entity.** Zero
occurrences of `jurisdiction` or `countryCode` in the schema. Location is free
text (`Startup.location`, `Startup.headquarters`, `UserProfile.country`).

India-specific terms outside an India-scoped module:
- `schema.prisma` — `Currency.INR` (default), `DocumentType.PAN`, `GST`,
  `DPIIT_RECOGNITION`, `DIGITAL_SIGNATURE` in a global enum.
- `apps/api/src/modules/verification/providers/` — MCA, GSTIN, DPIIT, SEBI,
  UGC/AICTE, ICAI/Bar, DigiLocker, AIM/DST. These *are* effectively an India
  pack, but they sit in the generic provider directory behind a common
  interface and are wired by name in `verification-provider.registry.ts`
  constructor — adding a second jurisdiction would touch core code today.
- `trust-engine.service.ts` — `mcaVerified`, `dpiitVerified`, `gstinVerified`
  are **named India signals inside the core scoring model**. This is the
  clearest D11 breach: the rubric itself is India-shaped.

### 1.9 Infrastructure

| | |
|---|---|
| Deployed | **Yes.** `https://vittamhub.com` (Vercel) · `https://api.vittamhub.com` (Railway). Valid TLS, www→apex 308, HSTS. |
| Production email | **Configured but non-functional.** Resend key present; **no SPF/DKIM/DMARC records published**, so it only delivers to the account owner's own address. |
| Backups / restore tested | **Could not determine.** Neon provides PITR by plan; I have no Neon console access. No backup or restore procedure exists in the repo. |
| Job runner | **Yes** — BullMQ + Redis Cloud, 3 queues, 2 cron schedulers, with a circuit breaker added this week. |
| Migration framework | **Yes** — Prisma, 12 migrations, now auto-applied via Railway `preDeployCommand`. |
| Test suite | 70 unit tests (9 suites) + 3 e2e specs. **Coverage of the areas above is thin**: auth, trust-model, CSRF, documents, media and publish-leniency are covered; identifiers, relationships, scoring-engine signal gathering and jurisdiction are not. `apps/web` has **zero** test files. |

**Environment finding not in the brief:** `apps/api/.env` points at a *different
Neon project* (`ep-misty-hat-…`) than production (`ep-orange-dew-…`). Local
work and the e2e suite run against dev; it is easy to mistake one for the
other. Earlier status docs citing "16 startups / 43 users" were describing dev.

---

## 2. Gap table

| # | Requirement | Current state | Gap | Effort | Risk if changed | Notes |
|---|---|---|---|---|---|---|
| D1 | Four subjects | absent | `Startup` fuses person/entity/venture; `ownerId @unique` blocks multi-venture founders | weeks | **Near zero today** — 1 startup, 0 investors | The unique constraint is the load-bearing problem, not the table shape |
| D2 | Verification attaches to claims | **exists** | none | — | — | `field` column already does this. Docs underestimate the codebase |
| D3 | V0 = exactly zero | **violated** | 19/100 pts from typed input (`companyDepth` 10, `profileLive` 5, `productBundleComplete` 4) | hours | Scores shift down; v2 is shadow-mode so no user sees it | Cheapest high-value fix in the entire audit |
| D4 | Attainability denominator | partial | `stageApplicability` exists in trust-model; no entity-form or jurisdiction axis | days | Low | Better than docs assume |
| D5 | Per-class freshness decay | partial | `decayFactor()` exists, unit-tested, **not wired into `computeTrust`** | days | Low | Dead code awaiting a shadow-diff |
| D6 | `unable_to_verify` ≠ `failed` | **violated** | No such state; conflated with `PENDING` | hours | Low — 1 verification row exists | Enum + backfill |
| D7 | Two signals never combined | absent | One trust score for all subjects; investors reuse a variant | days | Low | No Founder Credibility concept |
| D8 | Risk as register | absent | Penalties subtract directly in `computeTrust` | days | Low | |
| D9 | Never name-match adverse data | **satisfied by absence** | No adverse-data source at all | — | — | Nothing to get wrong yet. Keep it that way |
| D10 | Idea 3-layer disclosure | absent | No idea subject, no L1/L2/L3, no acknowledgement records | weeks | None today | Legally the highest-stakes gap |
| D11 | No jurisdiction constants in core | **violated** | India signals named in the scoring model; no jurisdiction concept anywhere | weeks | Low now, high later | Adding country #2 currently touches core |
| D12 | No cross-jurisdiction comparison | n/a | Single jurisdiction, so unenforceable either way | — | — | Becomes real at D11 |
| D13 | Counterparty graph, no bulk import | **satisfied** | No `Organisation` model, but also no bulk import anywhere | — | — | Preserve this when adding Organisation |
| D14 | Two-sided confirmation | **exists** | Confirmation weight does not scale with confirmer depth | days | Low | Core mechanic already works |
| D15 | Verify and purge identity docs | **violated** | Identity documents retained indefinitely; `rawResponse` kept forever | days | Low — 0 documents exist | Fix before the first real upload |
| D16 | Data protection gate | **violated** | No consent record, no regime detection, no signup gate | weeks | Legal, not technical | One EU signup creates GDPR exposure |
| D17 | Additive migrations only | **satisfied so far** | Prior USD→INR used `RENAME COLUMN` (not additive) but harmed nothing | — | — | See §4 |
| D18 | amount_minor + currency + as_of_date | partial | `Decimal` major units + currency enum; no `as_of`, no fx fields, no preserved originals | days | **Nil** — 0 rows with money | Fix now while free |

---

## 3. Conflicts

**The architecture docs are wrong about this codebase in four places, and the
code is right in three of them.**

**3.1 — D2 is already implemented; the docs assume it isn't.**
`VerificationRecord.field` already targets a claim (`"gstin"`,
`"portfolioCompany:<id>"`), not a document. Building "claim-level verification"
as new work would duplicate a working table. *Recommendation: mark D2 done.*

**3.2 — The docs assume an admin review queue should exist. `CLAUDE.md` §6
forbids one, and the code correctly has none.** The wider spec still defines
V1 as "document uploaded, **admin-reviewed**" and asks for a moderation queue
with SLAs. These cannot both hold. V1 currently means "document on file,
automated check pending". *Recommendation: resolve this contradiction before
any verification UI is built — it affects ~40 field definitions.*

**3.3 — D18's migration warning is retrospective and the damage did not occur.**
The docs warn that relabelling USD→INR "silently misstates every historical
figure by ~88×". That migration already happened, via `RENAME COLUMN`, with no
preserved original — exactly the prohibited shape. **But every money column in
production is 0 and there is 1 startup.** The warning is correct in principle
and moot in fact. *Recommendation: implement `as_of_date`/fx fields as new
structure, not as a data-repair exercise. There is nothing to repair.*

**3.4 — The docs treat migration risk as the dominant constraint. It is
currently the smallest one.** Every phase in `04-phase-plan.md` is shaped by
dual-write/reconcile/flagged-read caution appropriate to live founder data.
Production has 1 startup, created by me during this audit. *Recommendation:
see §5 — this inverts the plan.*

**3.5 — Not a doc conflict, but the docs miss it entirely: the scoring rubric
is India-shaped at its core.** `mcaVerified` / `dpiitVerified` / `gstinVerified`
are field names inside `TrustSignals`. D11 talks about jurisdiction packs for
*adapters*; the deeper problem is that the *rubric* enumerates Indian
authorities. A jurisdiction pack cannot fix a signal name.

---

## 4. Data reality

Counts taken from the **production** database (via the running container), not
the local dev project:

| Table | Rows |
|---|---|
| users | **14** |
| startups | **1** (published; created during this audit) |
| investors | **0** |
| connections | **0** |
| documents | **0** |
| verification_records | **1** |
| relationship_claims | **0** |
| trust_score_snapshots | **0** |
| metric_observations | **0** |
| funding_rounds | **0** |

- **Real vs test:** effectively all 14 users are test accounts. At least 8 were
  created by me today during production debugging (`probe*@`, `demo*@`,
  `verify*@`, `pub*@`, `final*@` — all `@gmail.com`/`@example.com` synthetic
  addresses). **Real founders: 0.**
- **Identifiers populated:** 0 — no identifier fields exist to populate.
- **Money values:** `startups with fundingRaisedAmount > 0` = **0**. Currency
  distribution: 1 row, `INR`. **No USD row exists anywhere.**
- **Duplicates:** none possible to assess meaningfully at n=1. No CIN column
  exists, so CIN duplication is unenforceable *and* currently irrelevant.

**Verdict on migration risk: it is neither "an afternoon" nor "a project" — it
is effectively zero.** There is no live founder data. Every structural
decision in D1/D18/D6 can be made as a *greenfield* decision right now, at the
cost of ordinary development time and none of the dual-write machinery D17
exists to protect.

This window closes the moment real founders sign up.

---

## 5. Recommended phase sequence for *this* codebase

**Already done — remove from the plan:** D2 (claim-level verification), D14
(two-sided confirmation, minus weighting), D13 (no bulk import), metric history,
trust snapshot persistence, INR default, controlled industry list, permissioned
data room with expiry/NDA/view-log, public-profile projection, deployment,
migrations, job runner.

**Unnecessary here:** the dual-write/reconcile/flagged-read migration apparatus
in `04-phase-plan.md`, *for as long as production stays empty*. D17's caution is
correct in general and currently buys nothing.

**Order should change.** The generic plan front-loads production readiness
(Phase 0) then the subject model (Phase 1). Given the data reality, the subject
model is the thing that gets more expensive every day, and production readiness
is largely already done.

### Single highest-value next change

**Delete the D3 violations from the scoring model** — `companyDepth` (10 pts),
`profileLive` (5), `productBundleComplete` (4).

Why this and not the subject model: it is *hours*, not weeks; v2 is shadow-mode
so **no user-visible score changes**; there are 0 snapshots to invalidate; and
it removes the one defect that actively undermines the product's founding
claim. Every day it stays, the number means less. It is also the cheapest
possible proof that the D-decisions are being enforced rather than admired.

**Then, in order:**
1. **D6** — add `UNABLE_TO_VERIFY`. Hours, 1 row affected, unblocks honest
   attainability maths (D4).
2. **D1 subject model** — while production is empty. The `ownerId @unique`
   constraint is the specific thing to kill; it silently forbids serial
   founders and second ventures.
3. **D18 money shape** — add `as_of_date` + fx fields as new structure. Free now.
4. **D15/D16** — before the first real document upload or non-Indian signup,
   both of which are one user action away.

### Urgent, not covered by the plan

- **Object storage is unconfigured, and until this week failed *open*:** with
  `STORAGE_*` unset, the AWS SDK returned a valid-looking presigned URL
  pointing at `s3.auto.amazonaws.com`, so the API answered 200 and the browser
  uploaded user files to an unrelated endpoint. Now fails closed. **Uploads do
  not work at all** — this blocks Bundle 21 and onboarding step 8.
- **No error monitoring.** `SENTRY_DSN` unset on both apps. The API sat dead
  for two days after a transient Neon outage and nothing reported it.
- **`DATABASE_URL` is unpooled**, with no `DIRECT_DATABASE_URL`. Contributed to
  that outage and caps scaling at one replica.
- **Email cannot deliver** to anyone but the account owner (no SPF/DKIM).
- **A defect that worsens with every row:** none outstanding. The two that did
  (read-triggered trust snapshot writes; permanent public document URLs) were
  both fixed this week.

---

*Audit performed read-only. No application file, schema, migration or config
was modified. The two files created — this report and `NOTES.md` — are the
only writes.*
