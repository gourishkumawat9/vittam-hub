# Continuous Integration

This document describes VittamHub's CI pipeline: what it validates, how it is
architected, and how to debug and reproduce it locally.

The pipeline lives in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

---

## 1. What CI validates

Every push to `main` and every pull request runs the full backend verification
suite before code can merge:

| Check           | Scope                        | Needs services |
| --------------- | ---------------------------- | -------------- |
| Lint (ESLint)   | all packages (turbo)         | no             |
| Typecheck (tsc) | all packages (turbo)         | no             |
| Unit tests      | `@vittamhub/api` (Jest)      | no             |
| Build           | all packages (turbo)         | no             |
| E2E tests       | `@vittamhub/api` (Jest + HTTP)| **yes**       |

The web app participates in lint / typecheck / build. It has no test suite yet,
so the unit-test step targets the API directly (see
[Common issues](#8-common-issues--troubleshooting)).

---

## 2. Triggers

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

A `concurrency` group cancels superseded runs on the same ref, so a rapid series
of pushes only pays for the latest.

---

## 3. Architecture

Two jobs. The expensive, service-backed `e2e` job runs only after the cheap
infra-free checks pass — fail-fast, and no database/Redis containers are spun up
for a branch that can't even lint.

```
push / pull_request
        │
        ▼
┌───────────────────────────────────────────────┐
│ job: quality            (ubuntu, no services)  │
│   install → prisma generate → lint →           │
│   typecheck → unit tests (+coverage) → build   │
│   → upload coverage + junit → codecov (opt)    │
└───────────────────────────────────────────────┘
        │ needs: quality  (must pass)
        ▼
┌───────────────────────────────────────────────┐
│ job: e2e                (ubuntu)               │
│   services: postgres:16, redis:7              │
│     (health-gated — job waits until healthy)   │
│   install → prisma generate →                  │
│   e2e tests (migrates isolated test schema) →  │
│   upload junit report                          │
└───────────────────────────────────────────────┘
```

### Why this shape

- **Fail-fast + cost control.** Lint/typecheck/unit are seconds; standing up
  Postgres + Redis and running e2e is the expensive part. Gating e2e behind
  `quality` means a lint error never pays for containers.
- **Deterministic order.** The requested pipeline order (install → lint →
  typecheck → unit → e2e → coverage → artifacts) maps directly onto the two
  jobs and their `needs` edge.
- **Hermetic.** CI depends only on declared service containers and the committed
  lockfile — never on local machine state or production infrastructure.

---

## 4. Services

Provisioned by GitHub Actions `services:` (Docker containers on the runner):

| Service    | Image         | Port | Health check              |
| ---------- | ------------- | ---- | ------------------------- |
| PostgreSQL | `postgres:16` | 5432 | `pg_isready -U postgres`  |
| Redis      | `redis:7`     | 6379 | `redis-cli ping`          |

`postgres:16` matches the managed dev/prod database major version for parity.

GitHub **blocks the job until each health check reports healthy** — there are no
`sleep` commands and no startup race conditions. Health polls every 5s, up to 10
retries.

---

## 5. Environment & secrets

### The API's required env (validated at boot by `src/config/env.validation.ts`)

| Variable             | CI value                                        | Notes                                    |
| -------------------- | ----------------------------------------------- | ---------------------------------------- |
| `NODE_ENV`           | `test`                                          |                                          |
| `APP_URL`            | `http://localhost:3000`                         | CORS origin                              |
| `API_URL`            | `http://localhost:4000`                         | OAuth callback base                      |
| `DATABASE_URL`       | `postgresql://postgres:postgres@localhost:5432/vittamhub` | points at the Postgres service |
| `REDIS_URL`          | `redis://localhost:6379`                        | points at the Redis service              |
| `JWT_ACCESS_SECRET`  | CI-only test value (≥32 chars)                  | signs ephemeral test tokens only         |
| `JWT_REFRESH_SECRET` | CI-only test value (≥32 chars)                  | signs ephemeral test tokens only         |

The e2e suite derives an **isolated `vittamhub_test` schema** from `DATABASE_URL`
at runtime (`test/support/env.ts`), so it never writes to the `public` schema.

### GitHub Secrets required: **none.**

This is deliberate, and it is the secure default:

- **Service-container credentials** (`postgres`/`postgres`) are throwaway,
  local to the runner, and destroyed when the job ends. They are not secrets.
- **JWT secrets** in CI sign tokens that only ever authenticate against the
  ephemeral test database. They are test fixtures, not production secrets, and
  are intentionally inlined (clearly labelled) so the pipeline works on a fork
  or a fresh clone with zero setup.
- **CI never has access to production credentials or data.** Requiring
  production secrets in CI would be an anti-pattern and an attack surface.

### Optional secret

| Secret          | Purpose                          | Behaviour if absent            |
| --------------- | -------------------------------- | ------------------------------ |
| `CODECOV_TOKEN` | Upload coverage to Codecov       | Step is `continue-on-error`; CI stays green. Public repos don't need it. |

---

## 6. Caching & performance

Target: **< 5 minutes.**

| What                | Mechanism                                   |
| ------------------- | ------------------------------------------- |
| pnpm store          | `actions/setup-node` `cache: pnpm`          |
| Turborepo task cache| `actions/cache` on `.turbo`                 |
| Prisma client       | regenerated per job (fast; no DB needed)    |

`pnpm install --frozen-lockfile` guarantees reproducible, lockfile-exact installs.
Turbo skips unchanged lint/typecheck/build tasks on cache hits.

---

## 7. Artifacts

| Artifact        | Contents                                              | Retention |
| --------------- | ----------------------------------------------------- | --------- |
| `unit-coverage` | `apps/api/coverage/` (lcov, html, clover) + JUnit XML | 14 days   |
| `e2e-report`    | `apps/api/reports/junit-e2e.xml`                      | 14 days   |

Coverage is generated via Jest's `--coverage`; JUnit XML via the `jest-junit`
reporter (attached on the CLI so the committed Jest config is untouched).

---

## 8. Run locally

### The exact commands CI runs

```bash
pnpm install --frozen-lockfile
pnpm --filter @vittamhub/api db:generate

# quality
pnpm turbo run lint
pnpm turbo run typecheck
pnpm --filter @vittamhub/api exec jest --coverage --ci
pnpm turbo run build

# e2e (needs Postgres + Redis reachable via env)
pnpm --filter @vittamhub/api exec jest --config ./test/jest-e2e.json --ci --runInBand
```

### Providing Postgres + Redis for e2e locally

The e2e suite needs a reachable Postgres and Redis. Two options:

**A. Use your existing `apps/api/.env`** (the default local dev path). The suite
loads it and carves out the isolated `vittamhub_test` schema automatically. Just run:

```bash
pnpm --filter @vittamhub/api test:e2e
```

**B. Reproduce CI's hermetic containers** (requires Docker):

```bash
docker run -d --name vh-pg  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vittamhub -p 5432:5432 postgres:16
docker run -d --name vh-redis -p 6379:6379 redis:7

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vittamhub" \
REDIS_URL="redis://localhost:6379" \
APP_URL="http://localhost:3000" API_URL="http://localhost:4000" \
JWT_ACCESS_SECRET="ci_only_access_secret_not_for_production_0123456789" \
JWT_REFRESH_SECRET="ci_only_refresh_secret_not_for_production_0123456789" \
NODE_ENV=test \
pnpm --filter @vittamhub/api exec jest --config ./test/jest-e2e.json --runInBand
```

This is byte-for-byte what the CI `e2e` job does.

---

## 9. Debugging a CI failure

1. Open the failed run → the failing job → the **first** red step. Steps run in
   order and CI stops at the first failure, so the first red step is the cause.
2. **Lint/Typecheck** → reproduce with `pnpm turbo run lint` / `typecheck`.
3. **Unit** → `pnpm --filter @vittamhub/api exec jest <file>`.
4. **E2E** → download the `e2e-report` artifact (JUnit XML names the exact failing
   test), then reproduce via option B above.
5. **Service/connection errors** → confirm the `Initialize containers` step shows
   both services healthy; check `DATABASE_URL` / `REDIS_URL` in the job env.

---

## 10. Common issues & troubleshooting

| Symptom                                             | Cause                                                        | Fix                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `turbo run test` fails on `@vittamhub/web`          | vitest exits non-zero on an empty suite                     | CI targets the API directly; add web tests before wiring web in     |
| `overrideGuard(ThrottlerGuard)` doesn't disable throttling | Nest ignores `overrideGuard` for `APP_GUARD` guards  | e2e overrides `ThrottlerStorage` instead (see `test/support/app.ts`) |
| `DATABASE_URL is missing` in e2e                    | job `env` not set / typo                                    | ensure the `e2e` job `env:` block defines it                        |
| Frozen-lockfile install fails                       | `pnpm-lock.yaml` out of date with `package.json`            | run `pnpm install` locally and commit the lockfile                  |
| Jest "did not exit" warning                         | an open handle (DB/Redis) not closed                        | tests close app + `testDb.$disconnect()` in `afterAll`; check new suites |

---

## 11. Test database isolation

- The e2e global setup (`test/support/global-setup.ts`) runs
  `prisma migrate deploy` into the **`vittamhub_test`** schema — never `public`.
- `test/support/database.ts` truncates that schema between tests.
- In CI the whole Postgres container is ephemeral, so isolation is doubly
  guaranteed: separate schema **and** throwaway database.
- **No production database is ever reachable from CI.**

---

## 12. Future improvements

- **Web test suite** — add vitest/RTL tests and fold `@vittamhub/web` into the
  unit-test step.
- **Coverage thresholds** — enforce a minimum once module coverage is broader
  (today only auth is unit-tested; a global gate would be misleading).
- **Turbo remote cache** — share the task cache across runs/branches for another
  speed-up as the monorepo grows.
- **Matrix parallelism** — split lint/typecheck/unit into parallel jobs if the
  suite outgrows the single `quality` job's budget.
- **Dependency & container pinning** — pin action SHAs and service image digests
  for supply-chain hardening.
- **CI job for migrations drift** — a check that `prisma migrate diff` is empty
  against the committed schema.
```
