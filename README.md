# VittamHub

**Visibility for Tomorrow's Unicorns.** A verified digital identity and discovery platform connecting startups with investors, mentors, incubators, universities, and strategic partners.

> This repository currently contains the **project foundation**: folder structure, design system, component library seed, backend module skeleton, database schema, and full architecture documentation. Feature implementation follows in subsequent PRs — see [What's built vs. what's next](#whats-built-vs-whats-next).

## Stack at a glance

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Zustand |
| Backend | NestJS modular monolith, Prisma, PostgreSQL |
| Cache / Queues | Redis (Upstash), BullMQ |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | JWT (httpOnly cookies), Google/LinkedIn OAuth, RBAC |
| Payments | Stripe |
| Email | Resend |
| Hosting | Vercel (web) + containerized API on a managed PaaS |
| Monorepo | Turborepo + pnpm workspaces |

Three architecture decisions were locked in before any code was written — see [docs/01-architecture-overview.md](./docs/01-architecture-overview.md) for the full reasoning:
1. **Backend**: modular monolith (not Next.js-only, not microservices-from-day-one)
2. **Scope**: web platform only for now (mobile-ready API/auth design, no native app yet)
3. **Infra**: managed platform stack (not self-hosted Kubernetes)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Start local Postgres + Redis
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Configure environment
cp .env.example .env
# fill in JWT secrets (32+ char random strings), OAuth/Stripe/storage keys as needed

# 4. Set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run everything
pnpm dev
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000) — [Swagger UI](https://swagger.io/tools/swagger-ui/) at `/docs`

## Repository structure

```
apps/
  web/            Next.js frontend
  api/            NestJS API
packages/
  tokens/         Design tokens + Tailwind preset
  ui/             Component library
  types/          Shared Zod schemas / types
  utils/          Shared helpers
  api-client/     Typed API client + React Query hooks
  config/         Shared tsconfig + ESLint presets
infra/
  docker/         docker-compose (local dev) + API Dockerfile
docs/             Architecture documentation (read this first)
```

## Documentation

Read in order for full context, or jump to what you need:

1. [Architecture Overview & Folder Structure](./docs/01-architecture-overview.md)
2. [Design System](./docs/02-design-system.md)
3. [Component Library](./docs/03-component-library.md)
4. [State Management](./docs/04-state-management.md)
5. [Routing Architecture](./docs/05-routing-architecture.md)
6. [API Architecture](./docs/06-api-architecture.md)
7. [Backend Architecture](./docs/07-backend-architecture.md)
8. [Database Planning](./docs/08-database-planning.md)
9. [Authentication & Security](./docs/09-authentication-security.md)
10. [Deployment, Scalability & Performance](./docs/10-deployment-infrastructure.md)

## Common commands

```bash
pnpm dev              # run web + api together
pnpm dev:web          # web only
pnpm dev:api          # api only
pnpm lint             # ESLint across all apps/packages
pnpm typecheck        # TypeScript across all apps/packages
pnpm test             # unit tests
pnpm test:e2e         # e2e tests (api)
pnpm build            # production build, all apps
pnpm db:migrate       # create/apply a Prisma migration (dev)
pnpm db:seed          # seed local database
```

## What's built vs. what's next

**Built in this pass**: monorepo scaffold, design tokens (color/type/spacing/radius/shadow/motion), a seed component library (Button, Input, Card, Badge, Avatar, Skeleton, EmptyState), route structure for marketing/auth/dashboard, the full NestJS module skeleton (auth fully wired; startups as a fleshed-out reference CRUD; investors/connections/discovery/notifications/billing/media/admin/audit-log scaffolded to the same pattern), the complete Prisma schema, Docker/CI scaffolding, and this documentation set.

**Not built yet, by design**: actual marketing/dashboard page content, the remaining UI primitives (Select, Dialog, Toast, DataTable, NavBar, Sidebar — see [docs/03](./docs/03-component-library.md)), CSRF token wiring end-to-end, 2FA enrollment, search-index-backed discovery ranking, Stripe checkout flow, and email sending. Each has a `TODO` comment in the relevant file pointing at the doc section that specs it out.
