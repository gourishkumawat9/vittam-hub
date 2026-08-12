# NOTES

Parking lot for out-of-scope observations. Nothing here was acted on.

---

## From Brief 00 (codebase audit)

**Two Neon projects, easily confused.** `apps/api/.env` points at
`ep-misty-hat-azdqsohb` (dev); production is `ep-orange-dew-azmhy1dj`. The e2e
suite derives its schema from the local `.env`, so it exercises dev. Earlier
status docs citing "16 startups / 43 users" were describing dev, not
production. Worth making the distinction explicit in the repo.

**14 production users are test accounts I created while debugging** — `probe*@`,
`demo*@`, `verify*@`, `pub*@`, `final*@`, plus the 1 published startup
("Probe Ventures"). Safe to purge before real signups; noting so nobody mistakes
them for traction.

**`decayFactor()` is dead code.** Implemented and unit-tested in
`trust-model.ts`, never called from `computeTrust`. Wiring it means changing
`TrustSignals` from booleans to decayed weights — the file's own comments say
that needs a shadow-mode diff first (D5).

**Two trust services coexist.** `startups/trust-score.service.ts` (v1, what
users see) and `trust/trust-engine.service.ts` (v2, shadow). The v1 service has
its own component set that does *not* match `trust-model.ts`. Any D3 cleanup
must decide whether v1 is also in scope, or is simply awaiting the
`FF_TRUST_V2` cutover and should be left alone.

**`Investment` vs confirmed `RelationshipClaim`** express the same fact in two
places (investor ↔ portfolio company). Not currently harmful — each carries
distinct workflow state — but a consolidation candidate when D1 lands.

**`rawResponse` is retained forever** on every `VerificationRecord`, including
future identity checks. D15 says registry responses about *companies* are fine
to keep, identity artifacts about *people* are not. The column cannot currently
distinguish them.

**Redis Cloud free tier cannot set `maxmemory-policy`.** `CONFIG SET` returns
`ERR Unsupported CONFIG parameter`; `INFO` still reports `volatile-lru`.
BullMQ's `noeviction` warning is therefore permanent on this plan. 3.18MB/30MB
used — low risk, but it is not a configuration mistake and cannot be fixed
without changing plan or provider.

**Railway's GitHub auto-deploy webhook is unreliable.** A `git push` frequently
does not trigger a build; forcing it needs
`railway service source connect --repo … --branch main --service vittamhub-api`.
**Vercel is not git-connected at all** — the web app must be deployed manually
with `vercel --prod --yes` from the repo root (running it from `apps/web` fails,
since Vercel then tries `npm install` in a pnpm monorepo).

**`apps/web` has zero test files.** `pnpm turbo run test` fails on that package
for "No test files found", which masks genuine failures in CI output.

**Spec-level contradiction to resolve before any verification UI:** the spec's
Section 10 asks for an admin manual-verification queue with SLAs and defines V1
as "admin-reviewed", while `CLAUDE.md` §6 forbids designing any feature around
a human approving or rejecting. V1 appears in roughly 40 field definitions
across the 30 bundles, so the reading materially changes the build.
