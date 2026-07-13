# 08 — Database Planning

Schema of record: [`apps/api/src/database/prisma/schema.prisma`](../apps/api/src/database/prisma/schema.prisma). This doc explains the modeling decisions the schema doesn't self-document.

## Engine and hosting

**PostgreSQL**, managed (Neon or Supabase — see [10-deployment-infrastructure.md](./10-deployment-infrastructure.md) for the chosen infra stack), not a NoSQL store. The domain is heavily relational (users → startups/investors → connections → notifications, with real referential integrity requirements like "a connection can't reference a deleted user") — Postgres's foreign keys and transactions are load-bearing here, not incidental.

## ERD (narrative)

```
User ──1:1── Startup            (a founder owns exactly one startup profile)
User ──1:1── Investor           (an investor owns exactly one investor profile)
User ──1:1── Subscription       (billing state)
User ──1:N── OAuthAccount       (Google/LinkedIn linked accounts)
User ──1:N── RefreshToken       (active/revoked sessions)
User ──1:N── Notification
User ──1:N── AuditLog (as actor, nullable — system actions have no actor)
User ──N:M── User (via Connection, self-referential: requester/recipient)
Startup ──1:N── StartupTeamMember
Startup ──0:N── Connection      (a connection can optionally be "about" a specific startup)
```

## Modeling decisions worth flagging

- **`User` is one table for all roles** (`role: UserRole` enum: `FOUNDER`/`INVESTOR`/`MENTOR`/`INCUBATOR`/`ADMIN`), with `Startup`/`Investor` as optional 1:1 extensions, rather than separate `Founder`/`InvestorUser` tables. This keeps auth, sessions, and notifications role-agnostic (one `RefreshToken`/`Notification` model, not five), at the cost of `Startup.ownerId` needing an application-level check that the owner's role is actually `FOUNDER` — Prisma can't enforce "this FK must point to a row where `role = 'FOUNDER'`" at the schema level, so that's a service-layer invariant (`StartupsService.create`), not a DB constraint.
- **Soft deletes (`deletedAt`) on `User`, `Startup`, `Investor`**, not hard deletes. An investor's accepted connection to a startup, or an audit log entry referencing a now-deleted account, needs the historical row to still resolve — hard-deleting would either cascade-orphan those records or require nullable FKs everywhere. Queries that should exclude soft-deleted rows need an explicit `deletedAt: null` filter today (Prisma has no first-class soft-delete middleware in v5); revisit with a Prisma Client extension if this filter gets forgotten in practice.
- **`RefreshToken` stores a SHA-256 hash of the token, never the raw value** — mirrors how passwords are hashed; a database read (backup leak, replica access, insider) shouldn't yield usable session tokens. See [09-authentication-security.md](./09-authentication-security.md).
- **`Connection` has a `@@unique([requesterId, recipientId, startupId])`** — prevents duplicate pending requests between the same pair (about the same startup) at the database level, not just application logic, so a race condition (double-click, retried request) can't create two.
- **`fundingRaisedUsd`, `checkSizeMinUsd`/`checkSizeMaxUsd` are `Decimal(14,2)`, never `Float`** — money is never a floating-point type; `Decimal` avoids the classic `0.1 + 0.2 !== 0.3` class of bug for anything that will eventually feed a billing or reporting surface.
- **`preferredStages`/`preferredIndustries` on `Investor` are native Postgres arrays** (`StartupStage[]`, `String[]`), not a join table. Chosen because these are small, rarely-queried-independently lists (an investor has at most a handful of preferred stages) — a join table would be correct but is unjustified complexity here. Revisit if a feature needs to query "all investors preferring fintech" at a frequency/scale where a GIN index on the array isn't enough.

## Indexing rationale

Every index in the schema backs a known query, not "just in case":
- `Startup(isPublic, verificationStatus)` — the exact filter the public discovery feed always applies first
- `Startup(industry)`, `Startup(stage)`, `Startup(isFundraising)` — the discovery filter facets
- `Connection(recipientId, status)` — "show me my pending connection requests," the single highest-frequency connections query
- `Notification(userId, readAt)` — "show me my unread notifications," same reasoning
- `AuditLog(entityType, entityId)` — admin looking up "what happened to this startup"

## Migrations

Prisma Migrate (`pnpm db:migrate` in dev, `pnpm db:deploy` in CI/CD — see `apps/api/package.json`). `SHADOW_DATABASE_URL` is required in `.env` because Prisma needs a scratch database to compute migration diffs safely without touching the real dev database. Every migration is a checked-in SQL file (`prisma/migrations/`, not yet generated since no `db:migrate` has run against a real database yet) — never hand-edit a generated migration; write a new one.

## Read scaling plan (for when a single primary isn't enough)

Not needed yet at pre-launch scale, but the path, in order of effort:
1. **Connection pooling** via PgBouncer (or the managed provider's built-in pooler — Neon/Supabase both offer one; `DATABASE_URL_POOLED` is already reserved in `.env.example` for this) — first lever, handles connection-count exhaustion under load, not query volume.
2. **Read replicas** for the discovery feed and public profile reads (the highest-read, lowest-write-consistency-requirement paths) — Prisma supports routing reads to a replica via a client extension; writes (auth, connections, admin actions) stay on the primary.
3. **A dedicated search index** (Meilisearch/Algolia — see [07-backend-architecture.md](./07-backend-architecture.md) §Discovery) takes discovery/search query load off Postgres entirely once ranking needs outgrow SQL filtering.
4. **Partitioning `AuditLog` by month** once it grows unbounded (it's append-only and grows forever by nature) — a natural first partitioning candidate long before `Startup`/`User` would need it.

## Seeding

`pnpm db:seed` runs [`apps/api/src/database/seed/seed.ts`](../apps/api/src/database/seed/seed.ts) — currently seeds one idempotent admin user. Extend with realistic fixture data (startups across every `StartupStage`, investors across every check-size band) as features land, so local dev and preview environments always have believable data to demo against.
