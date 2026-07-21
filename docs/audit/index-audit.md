# Phase 0 — Index Audit

Existing indexes on `Startup` and related tables, mapped against the investor filter surface (the hottest query path in the product). Read-only.

## Existing indexes relevant to discovery

| Table | Index | Notes |
|---|---|---|
| `Startup` | `@@index([industry])` | single-col; **on free text** (Q4) — fine for `=`, useless for taxonomy-tree queries |
| `Startup` | `@@index([stage])` | single-col; **on the conflated enum** (Conflict 1) — semantically buggy to filter on |
| `Startup` | `@@index([isFundraising])` | single-col **boolean** — very low selectivity alone |
| `Startup` | `@@index([isPublic, verificationStatus])` | composite; backs the public feed's base predicate |
| `Investor` | `@@index([investorType])`, `@@index([isPublic, verificationStatus])` | |
| `StartupProfileView` | `@@index([startupId, viewDate])` | analytics; adequate |
| `Connection` | `@@index([recipientId, status])`, `@@unique([requesterId, recipientId, startupId])` | adequate |

## The investor filter surface (spec §10 `/search/startups`, §15.2 hard filters)

A real investor query filters **several dimensions at once**:
`isPublic ∧ verificationStatus ∧ stage ∈ (…) ∧ industry ∈ (…) ∧ isFundraising ∧ cheque-size overlap ∧ min-trust ∧ geography ∧ exclusions`.

## Gaps

1. **No composite index for the multi-dimensional hot query.** Four single-column indexes force the planner into bitmap-AND across separate indexes. The actual filter combination (`isPublic, verificationStatus, isFundraising, stage`) — or a **partial index** `WHERE is_public AND is_fundraising` over `(verification_status, stage)` — would serve the discovery feed far better. This is the single highest-value index change and it is purely additive.

2. **Cheque-size range is un-indexed and in the wrong table.** Raise size lives in `StartupFunding.currentRaiseUsd` (a 1:1 side table), not on `Startup`, and is un-indexed — so the "cheque fit" hard filter (a top-3 investor screen) can't use an index at all. Post-metrics-migration this becomes an indexed column on `metric_current`.

3. **Trust score cannot be filtered or sorted in SQL** because it is never persisted (see `service-audit.md`). "min trust ≥ X" and "rank by trust" are impossible as indexed predicates today. `trust_scores` + a `current_trust` projection with an index resolves this.

4. **Geography is free text.** `Startup.location String` / `headquarters String` — no structured geo, no PostGIS, no index usable for radius/region filters. The `taxonomy_nodes` geography axis (country→state→city→ecosystem, ltree) plus a classification join replaces it.

5. **Metric-threshold triggers can't be indexed** (watchlist F11: "alert when MRR ≥ ₹5L"). Metrics are scalars spread across side tables with no time-series; the `metric_current` materialized view will need `(metric_key, value)` and `(startup_id, metric_key)` indexes to serve triggers efficiently.

## Recommended additions (all additive, none breaking)

| When | Index |
|---|---|
| Now (cheap win, no schema change) | partial composite on `startups (verification_status, stage) WHERE is_public AND is_fundraising` |
| Conflict 1 (stage decomposition) | indexes on `product_status`, `revenue_status`, `funding_status` (the real filter axes) |
| Conflict 3 (metrics) | on `metric_current`: `(startup_id, metric_key)`, `(metric_key, value)` |
| Trust v2 | on the current-trust projection: `(trust_score)` and `(band)` |
| Taxonomy | GiST on `taxonomy_nodes.path` (ltree); btree on `startup_classifications (axis, node_id)` |
| Vector | HNSW on `startup_embeddings.vector` (pgvector) |

**No existing index needs to be dropped.** Every recommendation is additive and safe to ship behind the same flags as the features that need them.
