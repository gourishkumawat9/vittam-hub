# 12 — Smart Connect Requests

## Why founders can't message investors directly

Left unchecked, a discovery platform where any founder can DM any investor degenerates into spam, and investors stop trusting their inbox — which kills the platform's actual value proposition (quality introductions). So there is exactly one channel from a founder to an investor: the **Connect Request** (`Connection` model, `apps/api/src/modules/connections/`). A founder writes a short introduction, optionally attaches a funding requirement, pitch deck, and executive summary; the investor can **Accept**, **Decline**, or **Ignore**. Only `ACCEPTED` unlocks free-form messaging (`Message` model) between the two parties — see [CLAUDE.md](../CLAUDE.md) §4 for the product rule this encodes.

## Data model

`Connection` (`schema.prisma`) already existed as a generic "request to connect" between any two users before this feature — it's extended, not replaced:

- `startupId` is **always derived server-side** from the requester's own `Startup` row (`Startup.ownerId` is `@unique`, one startup per founder) — never trusted from the request body, so a founder can never send a request "as" someone else's startup.
- `introduction`, `fundingRequirementUsd`, `pitchDeckUrl`, `executiveSummaryUrl` are the connect-request-specific fields; everything else about the startup (industry, stage, tagline) is already visible via the joined `startup` relation, so it isn't duplicated onto every request row.
- `status` (`ConnectionStatus`: `PENDING` → `ACCEPTED` | `DECLINED` | `IGNORED`, or `WITHDRAWN` if the requester cancels) gates everything downstream.
- `Message` only exists in the context of one `Connection` and is only reachable through it — `MessagesService`-equivalent logic (`ConnectionsService.assertCanMessage`) checks `connection.status === "ACCEPTED"` and that the caller is one of the two parties before any read or write. There's no message endpoint that doesn't go through this check.

## Quota enforcement — admin-configurable, not hardcoded

Rule: a Free-plan founder gets 5 connect requests per calendar month by default. This is **not** a constant in code — it's the `PlanLimit` table (one row per `SubscriptionPlan`), read by `PlanLimitsService.getMonthlyConnectRequestLimit(plan)`. `ConnectionsService.create()` counts the requester's `Connection` rows created since the start of the current calendar month and compares against the limit; `null` means unlimited. An admin changes the number via `PATCH /v1/admin/plan-limits/:plan` (`apps/web/src/app/(dashboard)/admin/page.tsx`) — no deploy required. A plan with no `PlanLimit` row yet (e.g. right after a fresh migration) falls back to a hardcoded default (`DEFAULT_MONTHLY_CONNECT_REQUEST_LIMIT` in `plan-limits.service.ts`) so the feature degrades safely rather than throwing.

This is deliberately just the quota mechanism, not a billing system — `Subscription.plan` still has no Stripe checkout flow wired to it (see [CLAUDE.md](../CLAUDE.md) §5); upgrading a user's plan today is a manual `Subscription.plan` update, exactly as scoped.

## Events, not direct coupling

`ConnectionsService` never calls `NotificationsService` directly — it emits domain events (`connection.requested`, `connection.accepted`, `message.sent`) via `EventEmitter2`, and `NotificationsService` listens (`@OnEvent(...)`) and turns them into `Notification` rows. This keeps the connect-request flow ignorant of how (or whether) a given event fans out to in-app notifications, email, or push later — a new listener can be added without touching `ConnectionsService` at all.

## What's intentionally not built yet

- **Real-time chat**: `useConnectionMessages` polls every 5 seconds (`packages/api-client/src/hooks/useConnections.ts`) instead of using websockets — the simplest thing that could work before real-time infra is justified by usage.
- **Meeting scheduling**: listed in the product rules as something that unlocks post-acceptance, but no calendar integration exists yet.
- **Re-requesting after a decline**: `@@unique([requesterId, recipientId, startupId])` on `Connection` means a founder can currently never send a second request to the same investor for the same startup, even months later with updated traction — worth revisiting if the product wants that.
- **Human verification / manual approval anywhere in this flow**: deliberately absent — see [CLAUDE.md](../CLAUDE.md) §6. `AdminController.setStartupVerification` (a manual verification action predating this feature) is the one existing exception worth reconciling against that rule.
