# Phase 0 — Test Coverage Map

Which of the existing 32 tests protect the surfaces this work will touch. Read-only.

## The whole suite

| Suite | File | Count | Covers |
|---|---|---|---|
| Unit | `src/modules/auth/auth.service.spec.ts` | 15 | AuthService (register/login/refresh/logout/MFA branch) |
| E2E | `test/auth.e2e-spec.ts` | 15 | Auth HTTP surface (register/login/me/refresh/logout/RBAC/rate-limit) |
| E2E | `test/health.e2e-spec.ts` | 1 | `/health` |
| E2E | `test/app-module.e2e-spec.ts` | 1 | DI graph compiles |
| **Total** | | **32** | **Auth + two smoke tests. Nothing else.** |

## Coverage of the surfaces this work touches

| Surface about to change | Protected by an existing test? |
|---|---|
| `Startup` model / startups module | ❌ none |
| `trust-score.service` (being strangled) | ❌ none |
| `profile-completion.service` | ❌ none |
| `founder-reputation.service` | ❌ none |
| `match-score.service` | ❌ none |
| `verification-engine.service` | ❌ none |
| Metric columns (`StartupTraction`/`StartupFunding`) | ❌ none |
| `Investor` / matching | ❌ none |
| Stage enum usage | ❌ none |

> The `grep` hits for "investor"/"startup" in the auth specs are **incidental** — those tests register users with `role: "INVESTOR" | "FOUNDER"` as fixtures; they exercise no startup/investor business logic.

**Every surface this project modifies is currently unprotected.** The 32 tests protect auth, which this project is instructed not to touch. The safety net exists precisely where we won't cut, and is absent precisely where we will.

## Characterization tests required BEFORE any change

Per standing rule 5 (characterization tests before touching untested code), capture current behaviour as executable tests *first* — so a strangler migration can prove equivalence, not hope for it.

**Priority 1 — before the trust-score strangle (Conflict 2):**
- `trust-score.service` — snapshot the current factor set, weights, and total for a fixture startup at each rung of the existing behaviour. This is the baseline the v2 parallel-run compares against. (It will also encode the P4 violations — that is fine; the point is to prove we changed them deliberately, not by accident.)
- `deriveBand` — snapshot the current thresholds before replacing bands.

**Priority 2 — before the metrics migration (Conflict 3):**
- Reads of `StartupTraction`/`StartupFunding` scalar columns via the startups service — snapshot the values the API currently returns, so the `metric_current` view can be proven to return the same numbers post-migration.

**Priority 3 — before stage decomposition (Conflict 1):**
- Every read/write of `Startup.stage` and every `where: { stage }` filter (startups list, discovery, match-score). Snapshot current filter results so the `legacy_stage` view can be proven equivalent for existing callers.

**Priority 4 — before verification changes:**
- `verification-engine.recompute*` — snapshot the `verificationStatus` transitions for each entity type, so wrapping it over a new ledger doesn't change the derived rollup for existing data.

## Note on the safety net's strength

32 tests is **thin** for a platform with this much scoring logic, and it is concentrated entirely in auth. Treat the existing suite as protection for auth only. For everything in this project, we are writing the net as we go — which is the correct order (characterization first), but it means velocity in early phases is gated on test-writing, and that is a feature, not a delay.
