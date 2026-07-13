# 09 — Authentication & Security

## Session model: httpOnly cookies, not localStorage tokens

The access token (short-lived JWT) and refresh token (opaque random string) are both set as **httpOnly, Secure (in prod), SameSite=Lax cookies** (`AuthController.setSessionCookies`) — never exposed to JavaScript. This was chosen over the "store a JWT in localStorage, attach as `Authorization` header" pattern specifically because localStorage is readable by any script running on the page — a single XSS bug anywhere in the app (a third-party widget, a dependency, a rendering bug with unescaped user content) becomes a full account-takeover vector if the token lives there. A cookie-based session is immune to that class of theft; the trade-off is that CSRF becomes the thing to defend against instead (see below), which is a well-understood, narrower problem.

- **Access token**: 15 min TTL (`JWT_ACCESS_TTL`), verified by `JwtStrategy` (`apps/api/src/modules/auth/strategies/jwt.strategy.ts`) reading the cookie via a custom Passport extractor (`cookieExtractor`) — deliberately *not* reading an `Authorization` header, so there's exactly one way a token can authenticate a request.
- **Refresh token**: 30 day TTL (`JWT_REFRESH_TTL`), opaque (not a JWT — a random 48-byte hex string), stored **hashed** in `RefreshToken.tokenHash` (SHA-256). **Rotated on every use**: `AuthService.refresh()` revokes the token it just consumed and issues a new pair, so a stolen-and-replayed refresh token only works once before the legitimate user's next refresh invalidates it — this is the standard mitigation for refresh-token replay.
- **Passwords**: hashed with **argon2** (`argon2.hash`/`argon2.verify` in `AuthService`), not bcrypt — argon2 is the current OWASP-recommended default, more resistant to GPU-accelerated cracking.

## CSRF

Cookie-based sessions need explicit CSRF protection (a form on an attacker's site can still trigger a cookie-bearing request). Approach: `@vittamhub/api-client`'s `apiRequest` attaches an `X-CSRF-Token` header on every mutating request (`http.ts`'s `isMutation` check), sourced from a `getCsrfToken()` callback configured via `configureHttpClient`. **Not yet wired end-to-end** — the double-submit-cookie pattern (API sets a readable, non-httpOnly `csrf_token` cookie; client echoes its value back as the header; API checks the two match) is the recommended implementation to finish before auth ships to real users, since `SameSite=Lax` alone blocks most but not all cross-site request forgery vectors (it doesn't block same-site subdomain attacks or top-level GET navigations that trigger side effects).

## OAuth

Google OAuth (`GoogleStrategy`, `passport-google-oauth20`) is scaffolded; LinkedIn is planned (env vars reserved in `.env.example`) since it's the natural professional-identity provider for both founders and investors on this platform. OAuth accounts link to the same `User` row via `OAuthAccount` (provider + providerAccountId), so a user who registers with email/password and later signs in with Google ends up as one account, not two — the linking logic (match-by-email-then-attach vs. always-create-new) is an open implementation decision for whoever builds out the OAuth callback controller.

## Authorization: roles, not just authentication

`RolesGuard` (`apps/api/src/common/guards/roles.guard.ts`) checks `@Roles(...)` metadata against the JWT payload's `role` claim — e.g. `POST /v1/startups` requires `@Roles("FOUNDER")`, `/v1/admin/*` requires `@Roles("ADMIN")` at the controller level. This is coarse (role-based), not fine-grained (e.g. "can this specific investor view this specific startup's private data room") — resource-level ownership checks (a founder can only edit *their own* startup) are handled in the service layer today (`StartupsService.create` derives `ownerId` from the authenticated user rather than trusting a client-supplied field) and should be audited per-endpoint as write operations expand.

## Two-factor authentication

Schema support exists (`User.twoFactorEnabled`, `twoFactorSecret`) but no TOTP enrollment/verification flow is implemented yet. Recommended as a priority before verified-investor accounts (which will hold sensitive deal-flow information) go live, using a standard TOTP library (`otplib`) rather than SMS-based 2FA (SIM-swap resistant).

## Input validation, injection, XSS

- **SQL injection**: not reachable by construction — every query goes through Prisma's parameterized query builder; there is no raw SQL string concatenation anywhere in the codebase, and it should stay that way (`$queryRawUnsafe` is banned by convention; `$queryRaw` with tagged templates is the only acceptable raw-SQL escape hatch if one is ever needed).
- **Input validation**: every mutating endpoint validates its body against a Zod schema (`ZodValidationPipe`, see [06-api-architecture.md](./06-api-architecture.md)) before it reaches a service — no controller trusts `req.body` shape.
- **XSS**: React escapes rendered content by default; the one deliberate exception to watch is any future rich-text startup description field — if `dangerouslySetInnerHTML` is ever introduced for that, it must go through a sanitizer (`isomorphic-dompurify`) server-side before storage, not just client-side before render.
- **Security headers**: `next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a baseline `Content-Security-Policy`, and `Permissions-Policy` disabling camera/mic/geolocation by default. The CSP currently allows `'unsafe-inline'`/`'unsafe-eval'` for scripts — a known temporary gap to close with nonce-based CSP once the third-party script surface (analytics, Stripe.js) is finalized. `apps/api`'s `main.ts` applies `helmet()` for the equivalent server-side header set.

## Rate limiting

Global `ThrottlerGuard` (100 req/60s per IP by default, see [06-api-architecture.md](./06-api-architecture.md)) — the first line of defense against credential-stuffing on `/v1/auth/login` and scraping on public discovery endpoints. A tighter per-route limit on `login`/`register` specifically (e.g. 5/min) is a natural next hardening step once real traffic patterns are observed.

## Audit logging

`AuditLogService` (`apps/api/src/modules/audit-log`) is an append-only log of privileged actions (currently: startup verification decisions). Every admin action that changes another user's data or account state should call `auditLog.record({ actorId, action, entityType, entityId, metadata })` — this is the record compliance/incident-response reaches for, and it's designed to never be updated or deleted, only appended to (no `update`/`delete` methods exist on the service by design).

## Secrets

Never committed — `.env` is gitignored, `.env.example` documents every required variable with no real values. `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are validated at boot (`env.validation.ts`, `z.string().min(32)`) to fail fast rather than silently accept a weak secret. Production secrets belong in the hosting platform's secret manager (Vercel env vars for `apps/web`; the API host's equivalent — see [10-deployment-infrastructure.md](./10-deployment-infrastructure.md)), never in a checked-in file at any point.
