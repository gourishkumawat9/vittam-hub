# Phase 0 — Reconciliation Plan

Recommended path, with the three known conflicts resolved concretely and a brownfield sequence with rollback points. This is a proposal for review, not an executed change.

## Architecture decision (closed)

**Two planes, one Postgres, Prisma stays.** The analytical plane (`metric_observations`, `verifications`, `trust_scores`, `taxonomy_nodes`, `startup_embeddings`, `matches`) is raw SQL behind typed repository interfaces, managed by Prisma Migrate with raw-SQL migration files and declared `@@ignore` to keep the client clean. **Confirmed feasible:** Neon is PG 16.14 with `vector`, `ltree`, `postgis`, `pg_trgm` all available (`schema-audit.md §Q6`). The Drizzle/Prisma question is dissolved, not answered.

---

## Conflict 1 — Stage: decompose, don't map

`Startup.stage` (`StartupStage` enum) conflates four axes (`schema-audit.md §classification`). Mapping S0–S6 onto it inherits a filter bug. Instead, add three orthogonal verified axes + derived labels. **All additive; the existing enum column stays during transition.**

**Backfill map (documented, reversible; ambiguity → NULL + founder prompt, never a guess):**

| existing `StartupStage` | product_status | revenue_status | funding_status |
|---|---|---|---|
| IDEA | concept | none | *NULL (prompt)* |
| VALIDATION | prototype | none | *NULL* |
| PROTOTYPE | prototype | none | *NULL* |
| MVP | beta | none | *NULL* |
| CUSTOMERS | live | first_revenue | *NULL* |
| REVENUE | live | recurring | *NULL* |
| FUNDED | *NULL (prompt)* | *NULL (prompt)* | seed |
| SCALING | scaled | recurring | series_a+ |
| UNICORN | scaled | profitable | series_c+ |

The NULLs are the proof the old enum was lossy: `FUNDED` tells us capital but nothing about product/revenue, so we ask rather than fabricate.

- `verified_stage` (S0–S6) is **derived** from the three axes + funding rounds + attested revenue + headcount — never founder-written.
- `declared_stage` (S0–S6) is the founder's answer; `declared ≠ verified` is the anti-inflation signal.
- `legacy_stage` is a **derived view** back to the old enum so the existing frontend/API keep working with **zero changes on day one**; deprecate on a published schedule.

**Rollback:** drop the three columns + view; the untouched `stage` enum still serves everything.

---

## Conflict 2 — Scoring: three scores, one engine, strangler

Collapse the semantics of five overlapping services (`service-audit.md`) into three clearly-separated scores, and fix the **live P4 violation** in the process.

| Score | Question | Raised by | Visible to |
|---|---|---|---|
| **Completeness %** | how full? | typing | founder only |
| **Trust 0–100** | how proven? | verification / evidence / integration / recency | everyone |
| **Reputation** | how do they behave? | response time, cadence, honored commitments | investors |

- `profile-completion` → REUSE as Completeness (stop feeding trust/reputation).
- `trust-score` → STRANGLE → v2 engine, verification-only, writes to append-only `trust_scores` with `model_version`, behind `FF_TRUST_V2`, parallel-run → compare distributions on the corpus → cut over per cohort → delete old after 14 clean days.
- `founder-reputation` → EXTEND (drop the completeness factor; own bands).
- `match-score` → EXTEND (consumer of all three; persist `matches`/`match_events`).

Trust v2 model + formula + stage-applicability matrix are specified in the replacement prompt §5; the **ladder/S0-can-reach-100/text-adds-zero(P4)/decay/hysteresis tests are written before the engine.**

**Rollback:** flag off → the old service still displays. Nothing deleted until parallel-run is clean.

---

## Conflict 3 — Metrics: observations, backfilled

Metrics are scalar columns across `StartupTraction`/`StartupFunding`/`StartupMarket`/`Startup` (`schema-audit.md §Q1`). This is the only irreversible-if-wrong retrofit.

1. Build `metric_observations` (partitioned by `period_start`) + `metric_current` (matview, `DISTINCT ON (startup_id, metric_key) ORDER BY verification_tier DESC, period_end DESC`) + `metric_definitions`.
2. **Backfill** every existing scalar as one observation: `source_kind='founder_declared'`, `verification_tier=0`, dated to the row's `updatedAt`.
3. **Dual-write** for one release (writes hit both the scalar column and a new observation); reads move to `metric_current` behind `FF_METRICS_V2`.
4. **Drop the scalar columns only after** the flag is fully rolled out and reads are stable.

`is_projection` is added from day one so forecast-vs-actual credibility is capturable going forward.

**Rollback:** flag off → reads revert to scalar columns, which are retained until the final step.

---

## Proposed brownfield sequence (rollback at every step)

| Phase | Scope | Rollback |
|---|---|---|
| **0** | This audit | read-only |
| **1** | `packages/taxonomy` (6 axes) + `packages/field-registry` (~400 fields) + `bundle_definitions` benefit copy + `metric_definitions` + Trust v2 component spec **as pure functions with the ladder tests** — **all data/pure logic, no schema changes** | delete files |
| **2** | Analytical tables (`verifications`, `metric_observations`, `trust_scores`, `taxonomy_nodes`) — additive migrations + `CREATE EXTENSION vector/ltree` | drop new tables |
| **3** | Stage decomposition + `legacy_stage` view + backfill | view reverts |
| **4** | Trust v2 parallel-run behind `FF_TRUST_V2` | flag off |
| **5** | Registration audited vs P1; bundles + progressive onboarding + gamified dashboard | flag off |
| **6** | Verification connectors + India rails (dns→mca→gstin→dpiit) | per-connector flag |
| **7** | Integrations + metric backfill + `FF_METRICS_V2` cutover | flag off; scalars retained |
| **8** | Investor mandates, discovery, filters, two-sided confirmation | flag off |
| **9** | AI matching (embeddings, retrieval, scoring, explainability, feedback) | flag off |
| **10** | Admin verification queue, fraud, shadow trust console | flag off |

**Phase 1 is provably unblocked and additive under any decision.** Per standing rule 1 (escalate *and* proceed), I recommend proceeding on Phase 1 immediately after this audit is approved — it produces artifacts (taxonomy trees, field registry, benefit copy, pure-function trust spec + tests) that are valid regardless of every open question below, and touch no existing file.

---

## Decisions I need from you before guessing (standing rule 6)

1. **Live P4 violation — patch now or wait?** The current trust score is publicly displayed and rewards typing *today*. Options: (a) leave it running until the v2 strangler completes (cleanest, my default), or (b) ship a one-line hotfix now removing the `profileCompletion ≥ 80` factor to stop the worst leak while v2 is built. Your call — (a) is less risky, (b) is more principled sooner.
2. **Trust weights (§5 table)** are reverse-engineered to hit the 15→25→…→95+ ladder. Confirm them as the starting hypothesis, or adjust, before I encode them. (They get recalibrated against real intro→term-sheet outcomes within two quarters regardless.)
3. **Verification tier per connector** — confirm the V0–V3 assignment (e.g., is a founder-uploaded, unreviewed pitch deck V0 or V1?).
4. **Default field visibility policy** — the field registry needs a default (`public`/`investor_gated`/`nda_gated`/`private`) per field. Confirm the default posture (I'd propose: descriptive fields public, financials `investor_gated`, cap table/legals `nda_gated`).
5. **Typed tables vs polymorphic `organizations`** — the repo uses typed per-actor tables; the spec specified polymorphic. **I recommend keeping the typed tables** (cleaner in Prisma, already built for 5 of 6 actors). Confirm.
6. **Government-org actor** — the only missing actor type. Add in Phase 9 as specified, or defer? (Accelerator ≈ existing `IncubatorProfile`.)
7. **Spec truncation** — the pasted spec cut off at §16. Per standing rule 3, please add the full spec to `docs/SPEC/` as files before Phase 3+; I don't have §16-end.

---

## Summary verdict

The vision is **~70% already present** in some form (5 of 6 actor types, a startups spine, connect-request loop, investor pipeline, a verification recomputer, four scoring services). The three genuine conflicts — metrics-as-columns, completeness-in-trust, conflated-stage — are all **fixable additively with rollbacks**, none require an ORM change, and the analytical plane is fully supported on the existing Neon instance. **Option B (adapt onto the existing stack) is not just viable; the evidence makes it clearly correct.** Greenfield would discard a working, tested, deployable platform to rebuild capabilities that largely exist.
