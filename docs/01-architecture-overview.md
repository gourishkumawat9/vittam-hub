# 01 — Architecture Overview & Folder Structure

## System shape

VittamHub is a **Turborepo monorepo** with two deployable apps and five shared packages. The backend is a **modular monolith**: one deployable NestJS service, internally split into domain modules with enforced boundaries, so it can be peeled apart into real microservices later without a rewrite — see [07-backend-architecture.md](./07-backend-architecture.md) for the boundary rules.

```
vittam-hub/
├── apps/
│   ├── web/                     # Next.js 14 (App Router) — the only user-facing surface
│   └── api/                     # NestJS modular monolith — the only thing that talks to Postgres
├── packages/
│   ├── tokens/                  # Design tokens + Tailwind preset (single source of design truth)
│   ├── ui/                      # Token-driven component library (Button, Card, Input, ...)
│   ├── types/                   # Zod schemas + inferred types shared across the API boundary
│   ├── utils/                   # Framework-agnostic helpers (format, slug, pagination)
│   ├── api-client/              # Typed fetch wrapper + React Query hooks — the only fetch() to our API
│   └── config/                  # Shared tsconfig bases + ESLint preset
├── infra/
│   ├── docker/                  # docker-compose (local Postgres/Redis) + api.Dockerfile
│   └── terraform/               # reserved — empty until we outgrow the managed platform stack
├── docs/                        # this folder — the architecture record of truth
└── .github/workflows/           # CI (lint, typecheck, test, build) — see docs/10
```

## Why this shape

**Two apps, not one.** `apps/web` and `apps/api` deploy independently (Vercel for web, a container/PaaS for the API). This was chosen over a Next.js-only full-stack app so the backend is genuinely "container-ready" and can scale its compute independently of the frontend's edge/CDN needs — see the three decisions this project opened with (backend style, product scope, infra stack) which all point the same direction: modular monolith + web-only + managed platform.

**Five packages, each with one job.**
- `tokens` has zero React dependency — it's plain TS objects plus a Tailwind preset function, consumable by web today and a docs site or React Native app later.
- `ui` depends on `tokens` but nothing app-specific — no Next.js imports, no API calls. A component that needs data takes it as props; data-fetching hooks live in `api-client` and get composed in `apps/web`.
- `types` is the actual contract: the same Zod schema validates a `react-hook-form` on the client and a Nest controller body on the server. One schema, enforced twice.
- `api-client` is the *only* place `fetch()` should appear for talking to our own API — components import hooks (`useStartup`, `useLogin`), never call `apiRequest` directly.
- `config` holds the tsconfig bases and ESLint preset every other package/app extends, so a lint-rule change is a one-file edit, not a fifteen-file find-and-replace.

**`apps/api` modules never import each other's Prisma models directly.** `ConnectionsModule` doesn't run raw queries against the `Startup` table — it calls into `StartupsService` (exported from `StartupsModule`) if it needs startup data. This is the one rule that keeps a "modular monolith" from silently becoming a ball of mud, and it's the same rule that makes a later split into real services mechanical rather than archaeological.

## Route structure (`apps/web/src/app`)

```
app/
├── (marketing)/          # public: home, pricing, public startup/investor profiles — no auth
├── (auth)/               # login, register, forgot-password — chrome-free shell
├── (dashboard)/          # authenticated shell (sidebar + topbar)
│   ├── founder/          # founder-only surfaces
│   ├── investor/         # investor-only surfaces
│   └── admin/            # admin-only surfaces
└── api/health/           # liveness check consumed by the platform's health monitor
```

Route groups (the parenthesized folders) let three very different shells — marketing chrome, a bare auth card, a persistent dashboard sidebar — coexist without one giant conditional layout. See [05-routing-architecture.md](./05-routing-architecture.md) for how role-based access is actually enforced (middleware + server-side checks, not just hiding nav items).

## What's deliberately not built yet

This PR is foundation only, per the brief: folder structure, design tokens, a handful of exemplar components, the module skeleton, the Prisma schema, and this documentation set. Feature pages (`app/(marketing)/page.tsx`, the dashboards) render placeholder copy with `TODO` comments pointing at the doc section that specs them out. Domain modules beyond `auth` and `startups` (investors, connections, discovery, notifications, billing, media, admin, audit-log) have working services/controllers for their core operation but not full CRUD — they establish the pattern every subsequent feature PR should follow.
