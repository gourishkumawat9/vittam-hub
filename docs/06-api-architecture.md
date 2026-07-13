# 06 — API Architecture

## Contract shape

Every response, success or error, is wrapped consistently so `@vittamhub/api-client` never has to branch on shape:

**Success** (`TransformInterceptor`, global): `{ "data": T, "requestId": "uuid" }`
**Error** (`HttpExceptionFilter`, global): `{ "error": { "code": "STRING", "message": "human readable", "requestId": "uuid", "details"?: {...} } }`

`ApiClientError` (`packages/api-client/src/http.ts`) parses the error shape and exposes `.status`, `.apiError.code`, `.apiError.message` — UI code should switch on `code` (stable, machine-readable) for behavior and show `.message` (may change wording) to users.

## Versioning

Every route is prefixed `/v1/...` at the controller level (`@Controller("v1/startups")`), not via a global Nest prefix — this was a deliberate choice so `docs/` (Swagger tags), individual controllers, and any future `/v2/...` controller coexisting during a migration are all visible in the same route table rather than hidden behind a global config flag.

## Request lifecycle (global providers, in order)

```
ThrottlerGuard → JwtAuthGuard → RolesGuard → [controller method] → TransformInterceptor → response
                                                        ↓ (on throw, any stage)
                                              HttpExceptionFilter → error response
```

Registered as `APP_GUARD`/`APP_INTERCEPTOR`/`APP_FILTER` in `app.module.ts` — every route gets rate-limiting, auth, and consistent response shaping by default. Opting out is explicit and visible: `@Public()` skips `JwtAuthGuard`; a route with no `@Roles(...)` skips `RolesGuard`'s check entirely (open to any authenticated user).

## Validation

Request bodies/queries validate against **the same Zod schemas** `apps/web` uses for `react-hook-form` (`@vittamhub/types` — `createStartupInputSchema`, `startupSearchFiltersSchema`, etc.), via `ZodValidationPipe` (`apps/api/src/common/pipes/zod-validation.pipe.ts`) applied per-route with `@UsePipes(...)`. One schema, defined once, enforced on both sides of the network boundary — a new required field can't be added to the frontend form and forgotten on the backend, because there's only one place it's declared.

## Swagger / OpenAPI

`@nestjs/swagger` generates the OpenAPI document from the same decorators (`@ApiTags`, `@ApiOperation`) already on each controller — no separate spec file to keep in sync. Served via [Swagger UI](https://swagger.io/tools/swagger-ui/) at `GET /docs`, gated to non-production environments in `main.ts` (`NODE_ENV !== "production"`) so the full route surface isn't discoverable publicly once real users are on the platform. Re-enable behind an admin-only auth check later if internal/partner API consumers need it in prod.

## Rate limiting

`@nestjs/throttler`, configured from `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX` env vars (default: 100 req/60s per IP, global). This is a first line of defense against scraping/abuse, not a substitute for auth — sensitive mutation endpoints (auth login/register, connection requests) are natural candidates for a *tighter* per-route `@Throttle()` override once abuse patterns are observed in production.

## Real-time (not built yet)

Notifications (`NEW_MESSAGE`, `CONNECTION_REQUEST`) are currently poll-based (`useNotifications` would poll on an interval once built). The `EventEmitterModule` wiring already in `app.module.ts` (`connection.requested` → `NotificationsService.handleConnectionRequested`) is the seam where a WebSocket gateway (`@nestjs/websockets`) would plug in later to push instead of poll — the domain event already exists, only the transport from server → connected clients is missing.

## Background jobs

`BullMQ` (via `@nestjs/bullmq`, connected to the same Redis as caching) is wired at the module level (`app.module.ts`) but no queues/processors exist yet. First real candidates: sending verification/welcome emails (Resend), Stripe webhook side-effects that shouldn't block the webhook response, and any future search-index sync (see [07-backend-architecture.md](./07-backend-architecture.md) §Discovery).
