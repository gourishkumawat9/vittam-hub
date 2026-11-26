# 10 — Deployment, Scalability & Performance

## Infrastructure stack (managed platform — the chosen path)

| Concern | Choice | Why |
|---|---|---|
| Frontend hosting | **Vercel** | Native Next.js support (edge middleware, ISR, image optimization), zero-config preview deployments per PR |
| API hosting | **Container on a managed PaaS** (Render/Fly.io/Railway to start; ECS Fargate if AWS-native is preferred later) | `infra/docker/api.Dockerfile` builds a portable image — genuinely container-ready, not locked to one vendor |
| Database | **Managed Postgres** (Neon or Supabase) | Connection pooling, branching (Neon) or built-in auth/storage extras (Supabase) without running our own Postgres |
| Cache / queues | **Upstash Redis** | Serverless-billed, no cluster to manage; backs both React Query-adjacent server caching and BullMQ job queues |
| Object storage | **Cloudflare R2** | S3-compatible API (works with the same `@aws-sdk/client-s3` client already in `apps/api`), zero egress fees — meaningful once startup logos/media are served at real traffic volume |
| Email | **Resend** | Modern deliverability, good DX for transactional email (verification, connection-request notifications) |
| Payments | **Stripe** | Webhook handling already scaffolded in `BillingModule` |
| Error tracking | **Sentry** (`SENTRY_DSN` reserved in `.env.example`) | Not wired yet — `error.tsx`'s `console.error` and `HttpExceptionFilter`'s `Logger.error` are the two integration points |

This stack was chosen over fully self-hosted AWS/GCP + Kubernetes specifically to get to a working, demoable product fast without a dedicated DevOps hire — every piece above is a straightforward swap later (Docker image → EKS, Neon → RDS, Upstash → ElastiCache) because nothing in the application code is vendor-locked: Prisma abstracts the DB, the S3 SDK abstracts storage, and the API is a plain containerized Node process.

## CI/CD

`.github/workflows/` (directory scaffolded, pipeline not yet written) — the intended shape:

```yaml
# ci.yml (to add)
on: [pull_request]
jobs:
  build:
    steps:
      - pnpm install --frozen-lockfile
      - turbo run lint typecheck test build   # Turborepo caches unchanged packages
```

- **Every PR**: lint + typecheck + unit tests + build, gated before merge
- **`main` merge → Vercel** auto-deploys `apps/web` (preview deploys already happen per-PR automatically via Vercel's GitHub integration once the project is linked)
- **`main` merge → API**: build `infra/docker/api.Dockerfile`, push to the registry, deploy to the PaaS, run `pnpm db:deploy` (Prisma migrate deploy) against production *before* the new API version receives traffic — migrations must be backward-compatible with the previous API version during the deploy window (additive changes first, remove-old-column in a follow-up deploy)

## File storage setup (Cloudflare R2)

Uploads go from the browser straight to storage on a short-lived signed link; the API only signs. Until all six `STORAGE_*` variables are set on the API, every upload is refused with a message naming what is missing.

1. Create **two** buckets: a private one for documents (`STORAGE_BUCKET`) and a public one for logos and avatars (`STORAGE_PUBLIC_BUCKET`). Attach the public domain (`STORAGE_PUBLIC_CDN_URL`, e.g. `https://media.vittamhub.com`) to the public bucket only. A domain on the documents bucket would make every pitch deck readable by URL.
2. Create an R2 API token with read and write on both buckets, and set `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID` and `STORAGE_SECRET_ACCESS_KEY` on the API.
3. Give **each** bucket this CORS rule, or the browser refuses to send the file:

   ```json
   [{ "AllowedOrigins": ["https://vittamhub.com"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```

The link is a signed `PUT`, not a form `POST`: R2 does not accept form uploads. The size limit (5 MB pictures, 20 MB documents) is checked by the API and then signed into the link as the exact `Content-Length`, so storage rejects a body of any other size.

The website's Content-Security-Policy (`apps/web/next.config.mjs`) allows uploads to `*.r2.cloudflarestorage.com` and pictures from `media.vittamhub.com`. For any other store or picture domain, set `NEXT_PUBLIC_UPLOAD_ORIGINS` / `NEXT_PUBLIC_MEDIA_ORIGINS` on the website and redeploy it.

## Environments

Three tiers: **local** (`docker-compose.yml` for Postgres/Redis, `.env` for secrets), **preview** (one per PR — Vercel preview + a preview API deploy pointed at a preview/branch database, ideally a Neon branch so preview data doesn't touch production), **production**. `NODE_ENV` gates behavior in exactly two places today: Swagger UI is disabled (`main.ts`) and cookies are marked `Secure` (`auth.controller.ts`) only when `production`.

## Scalability plan — how this reaches "10M startups, 5M investors, 100M users"

Nothing below is built yet; this is the sequence, triggered by actual bottlenecks rather than spec-following:

1. **Today → first 100K users**: the stack above, as-is. A single Postgres primary and a handful of API container instances behind the PaaS's load balancer easily clears this.
2. **Connection pooling** (PgBouncer/Neon's built-in pooler, `DATABASE_URL_POOLED` already reserved) — first lever when concurrent API instances start exhausting Postgres's direct connection limit, well before query *volume* is the bottleneck.
3. **Horizontal API scaling** — the API is already stateless (sessions are JWTs verified from a cookie, not server-side session storage), so scaling `apps/api` is "run more container instances behind the load balancer," zero code changes required. This is the payoff of the modular-monolith-but-stateless design choice.
4. **Read replicas + search index** — see [08-database-planning.md](./08-database-planning.md)'s read-scaling plan and [07-backend-architecture.md](./07-backend-architecture.md)'s discovery section. Splits read load (public profiles, discovery feed) off the write-serving primary.
5. **CDN + edge caching for public profile pages** — startup/investor public profiles are the highest-read, least-personalized pages on the platform; ideal candidates for Next.js ISR (`revalidate: 60` or similar) or a full edge cache, so a viral startup profile doesn't hit the API/DB per request.
6. **Splitting the monolith** — only once a specific module's load genuinely can't be served by scaling the whole API together (e.g., discovery/search needs GPU-backed ranking, or media processing needs different compute than request handling). Because of the module-boundary rule in [07-backend-architecture.md](./07-backend-architecture.md), this is "extract one module's service layer behind a network call" per split, not a rewrite.
7. **Sharding** — the actual answer to 100M+ users, and explicitly out of scope for now; the schema's UUID primary keys (rather than auto-increment integers) are the one decision made today that keeps this option open without a future migration, since UUIDs don't collide across shards the way sequential IDs do.

## Performance targets

- **Lighthouse ≥ 95**: `next/font` (not `<link>` tags) for zero layout shift from web fonts, `next/image` with AVIF/WebP (`next.config.ts`), route-level code splitting (automatic with the App Router), `optimizePackageImports` for `lucide-react`/`@vittamhub/ui` to avoid pulling the whole icon set into every bundle.
- **Edge rendering**: the health-check route (`app/api/health/route.ts`) already runs on the edge runtime as the reference pattern; extend to any route that's read-only and doesn't need Node-specific APIs (Prisma currently requires the Node runtime, so full pages hitting the DB directly stay on Node — only truly edge-safe routes should opt in).
- **Caching**: React Query's `staleTime` (client), Next.js's fetch cache + ISR (server), and Redis (API-level caching for expensive aggregations, once any exist) form three independent cache layers — each should be tuned separately as real usage patterns emerge, not guessed at upfront.

## Visit counts (Vercel Web Analytics)

The website mounts `@vercel/analytics` (`components/VercelAnalytics.tsx`, in the root layout). It records nothing until **Web Analytics is switched on in the Vercel project** (Project → Analytics → Enable) and the site is redeployed. The script and its reports are served from the site's own origin at `/_vercel/insights`, so the CSP needs nothing extra in production; off Vercel (e.g. `next start` locally) that path doesn't exist and the script simply fails to load. Before a page view is sent, `lib/analytics-url.ts` removes everything after `?` or `#` except `utm_*` tags, because the password-reset link and the two-factor sign-in carry codes there. The privacy page describes what is recorded, so update it if this changes.

## Observability (not yet wired, the plan)

- **Sentry** for error tracking (frontend + API), using the integration points already left as `TODO`s in `error.tsx` and `HttpExceptionFilter`
- **OpenTelemetry** (`OTEL_EXPORTER_OTLP_ENDPOINT` reserved in `.env.example`) for distributed tracing once there's more than one service to trace a request across
- **Structured logs** — `LoggingInterceptor` currently logs method/path/duration to stdout; the PaaS's log aggregation (or a dedicated sink like Axiom/Better Stack) is the next step once log volume outgrows scrolling through a dashboard
