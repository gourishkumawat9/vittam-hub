# 07 — Backend Architecture

## Modular monolith — the chosen middle path

Three options were on the table: (a) fold the backend into Next.js API routes, (b) split into real microservices from day one, (c) one NestJS deployable, internally split into domain modules with hard boundaries. **(c) was chosen.** Rationale: (a) can't satisfy "container-ready, microservice-ready" from the brief and couples backend deploys to frontend deploys; (b) pays real distributed-systems tax (service discovery, distributed tracing, cross-service auth, network calls where a function call used to be) before there's traffic to justify it. (c) ships as fast as a monolith today and splits cleanly later because the module boundary — not a network boundary — is already where a service boundary would go.

## The one rule that keeps a monolith from rotting

**A module never imports another module's Prisma model directly.** `ConnectionsService` doesn't do `this.prisma.startup.findMany()` — if it needs startup data, it imports `StartupsModule` and calls `StartupsService`'s exported methods. This is enforced by convention today (see `DiscoveryModule` importing `StartupsModule` and calling `StartupsService.search()` in [`discovery.service.ts`](../apps/api/src/modules/discovery/discovery.service.ts) as the reference example) — worth adding an ESLint boundary rule (e.g. `eslint-plugin-boundaries`) once the module count grows past ~10, so the rule is enforced by CI rather than code review vigilance alone.

Why this matters concretely: the day `StartupsModule` needs to become its own deployed service, every other module already talks to it through a service interface — swapping that interface's implementation from "call a local class method" to "call an HTTP/gRPC endpoint" is a one-file change per caller, not a hunt through raw Prisma queries scattered across the codebase.

## Module inventory

| Module | Owns | Status in this PR |
|---|---|---|
| `auth` | Register/login/refresh/logout, JWT issuance, Google OAuth strategy | Fully wired — see [09-authentication-security.md](./09-authentication-security.md) |
| `users` | User lookup by id/email/OAuth account | Minimal — read-only, used internally by `auth` |
| `startups` | Startup CRUD, public search/filter | Search + get-by-slug + create implemented as the reference pattern |
| `investors` | Investor profile CRUD | Get-by-id + create implemented |
| `connections` | Connection requests between users (investor↔founder intros) | Create/respond/list implemented, emits a domain event on request |
| `discovery` | Cross-entity ranking/feed (today: delegates to `StartupsService.search`) | Feed endpoint implemented; ranking logic is the open TODO |
| `notifications` | Persisted notifications + `@OnEvent` listeners for other modules' domain events | List/mark-read implemented; email/push fan-out is the open TODO |
| `billing` | Stripe subscription webhook handling | Webhook signature verification + subscription sync implemented; checkout-session creation is the open TODO |
| `media` | Pre-signed direct-to-storage upload URLs (Cloudflare R2) | Implemented |
| `admin` | Startup verification queue/approval | Implemented, gated `@Roles("ADMIN")` at the controller level |
| `audit-log` | Append-only record of privileged actions | `record()`/`listForEntity()` implemented; called by `admin` today |

## Cross-cutting concerns (global, not per-module)

- **`PrismaModule`** — `@Global()`, one `PrismaService` instance shared by every module (connection pooling lives in one place)
- **Guards** (`JwtAuthGuard`, `RolesGuard`) and **interceptors** (`Logging`, `Transform`) — registered once in `app.module.ts`, apply to every controller by default; see [06-api-architecture.md](./06-api-architecture.md) for the request lifecycle
- **`EventEmitterModule`** — the mechanism for one module to react to another without a direct dependency (e.g. `notifications` listening for `connection.requested` rather than `connections` importing `NotificationsService` directly and calling it inline). Prefer this over a direct service call whenever the caller doesn't need the callee's return value — it's a looser coupling that survives a future service split more gracefully.

## Discovery/search — today vs. next

`DiscoveryService.feedFor()` currently just calls `StartupsService.search()`, which is Postgres `ILIKE`/equality filtering. This is fine at the startup's current scale. The next step, once relevance ranking (typo tolerance, "startups similar to this one," personalized ordering by an investor's stated preferences) matters more than exact filtering, is a dedicated search index — Meilisearch (self-hostable, cheap) or Algolia (managed, faster to integrate) sitting alongside Postgres, kept in sync via a BullMQ job triggered on startup create/update. This is explicitly *not* built yet because it's premature before there's enough startup volume for ranking quality to matter.

## Testing strategy

- **Unit tests** (`*.spec.ts`, Jest) — service-level logic in isolation, Prisma mocked
- **E2E tests** (`*.e2e-spec.ts`, `test/` directory, Supertest) — one seed example (`health.e2e-spec.ts`) hitting a real Nest app instance; the pattern to extend as each module's controller layer firms up
- **`test/app-module.e2e-spec.ts`** — compiles the *entire* module graph (every provider gets constructor-injected) without needing a real database or Redis. This is the one check that catches two bug classes neither `tsc` nor ESLint can see: (a) a constructor-injected class imported via `import type` — TypeScript's `emitDecoratorMetadata` then emits the generic `Function` type instead of the real class, and Nest fails to resolve it at boot; (b) a provider that unconditionally constructs a third-party SDK client (Stripe, an OAuth strategy) in its constructor, which crashes the whole app in any environment missing that one optional key. Both bugs shipped silently through this exact codebase's typecheck/lint for several turns before this test caught them — run it after touching any module's providers or constructors, not just before a release.
- CI (see [10-deployment-infrastructure.md](./10-deployment-infrastructure.md)) runs both on every PR before merge is allowed
