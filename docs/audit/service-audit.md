# Phase 0 — Service Audit

The five scoring/verification services, with inputs, outputs, storage, callers, test coverage, and verdict. Read-only.

## The finding is the list itself

Five services compute overlapping scores with **no shared engine, no shared versioning, no shared decay, no shared audit, and three of them double-count profile completeness** — which two of them let leak into a trust/reputation number, violating P4.

| Service | Answers | Persists? | Versioned? | P4-clean? |
|---|---|---|---|---|
| `profile-completion` | how full is the profile | no (computed) | no | n/a (founder-only metric) |
| `trust-score` | how proven is it | no (computed each call) | no | ❌ **incorporates completeness** |
| `founder-reputation` | how does the founder behave | no (computed) | no | ❌ **incorporates completeness** |
| `match-score` | investor↔startup fit | no (computed) | no | n/a |
| `verification-engine` | overall verified? | yes → `verificationStatus` enum | no | — (not a score) |

**None persist a score history.** Every score is recomputed on read with live weights. There is no `trust_scores` table, so no point is traceable to a verification record over time, and no weight change can be shadow-tested — directly contradicting the governance requirements (spec §13.6).

## Per-service detail

### `startups/profile-completion.service.ts` → REUSE (rename intent)
- **In:** startup + relations. **Out:** `{ percent, missing[] }`. **Storage:** none.
- **Called by:** `trust-score`, `founder-reputation`, founder dashboard.
- **Verdict:** REUSE as the **Completeness %** score (spec §5 three-score model) — but it must become **founder-only** and its output must **stop feeding trust/reputation**. It is correct at what it does; it is just wired into the wrong consumers.

### `startups/trust-score.service.ts` → STRANGLE
- **In:** startup, owner profile, product, milestones, pitch-deck document, `profileCompletion`. **Out:** `{ score 0–100, band, factors[] }`. **Storage:** none.
- **P4 violations (evidence in `schema-audit.md §Q3`):** 8 of 10 factors are typing-earned; `profileCompletion ≥ 80` (w10) is the explicit one; `companyRegistered` (w15) trusts a founder-set enum with no MCA check.
- **Bands diverge from spec** (`EXCELLENT/HIGH/MEDIUM/LOW` @ 90/70/40 vs `Platinum/Gold/Silver/Bronze/Starting` @ 85/65/45/25).
- **Verdict:** STRANGLE — build Trust Score v2 as a versioned, verification-only engine writing to `trust_scores`, run in parallel behind `FF_TRUST_V2`, compare, cut over per cohort, delete old after 14 clean days. Do **not** edit in place; the current output is publicly displayed and a silent recompute would move every founder's score with no audit trail.

### `startups/founder-reputation.service.ts` → EXTEND (becomes Reputation)
- **In:** founder activity, community participation, mentor reviews, `verificationStatus`, `profileCompletion`, account age. **Out:** `{ score, band, factors[] }`. Reuses `trustScoreService.deriveBand` (definitional confusion — a *reputation* score sharing the *trust* band function).
- **P4 leak:** `profileQuality: completion.percent ≥ 80` (w15) — completeness again.
- **Verdict:** EXTEND into the **Reputation** score (§5): keep behavioural signals (activity, cadence, reviews, honored commitments), **remove the completeness factor**, give it its own bands, and stop sharing `deriveBand` with trust.

### `investors/match-score.service.ts` → EXTEND (consumer, not peer)
- **In:** `Investor` (stage/industry/checkSize prefs) + startup funding. **Out:** `{ score, reasons[] }`, weights 30/25/20/15/10. **Storage:** none — matches are computed on the fly and **never persisted**, so there are no `match_events` and therefore **no training data** (contradicts spec §15.7).
- **Verdict:** EXTEND — becomes the **consumer** of Completeness/Trust/Reputation plus the semantic + feature layers (spec §15). Must persist `matches` + `match_events`. Heuristic weights are fine for cold-start; they need a `match_events` corpus before any learned ranker.

### `verification/verification-engine.service.ts` → EXTEND (add the ledger beneath it)
- **In:** owner id. **Out:** writes `verificationStatus` enum on `Startup`/`Investor`/`Mentor`/`Incubator` (`recomputeStartup/Investor/Mentor/Incubator`, `onTransition`). **Storage:** the single enum field.
- **Verdict:** EXTEND — keep the recompute/transition orchestration, but sit it **on top of a new first-class `verifications` table** (tier, method, `expires_at`, immutable raw payload, status). Today it derives a boolean-ish enum from indirect signals; it needs an actual ledger of proven claims underneath, and the enum becomes a derived rollup of that ledger.

## Cross-cutting risks

1. **No score is persisted or versioned** → no history, no shadow mode, no traceability. Building `trust_scores` (append-only, `model_version`) is a prerequisite for the whole governance story, not a nice-to-have.
2. **Completeness leaks into two "trust-shaped" scores** → P4 is violated in production today, in two places.
3. **`match-score` throws away every match** → the highest-value training signal in the product (structured pass reasons, intro→meeting) is not being captured. Persisting `match_events` should start early even before any ML.
