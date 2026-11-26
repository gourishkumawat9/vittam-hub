# VittamHub — Project Instructions

These are durable, project-wide rules. They apply to every future task in this repo unless the project owner explicitly overrides them in a specific conversation.

## 1. Official logo

VittamHub has one official logo (mark + "VITTAMHUB" wordmark + "Visibility for Tomorrow's Unicorns" tagline). Once the actual logo asset file exists in this repo:

- Use it exactly as provided everywhere a brand mark appears: landing page, nav bar, footer, auth pages, registration, dashboards, loading screens, favicon, mobile app icon, email templates, reports, PDF exports.
- Never redesign, recreate, restyle, recolor, re-typeset, crop, stretch, or distort it. Never substitute placeholder text for it.
- **Current state**: `apps/web/src/components/Logo.tsx` (`LogoMark` + `Logo`) is a hand-built placeholder SVG created before the official asset was available — it is not the official logo and must be swapped out once the real asset file is placed in the repo (e.g. `apps/web/public/logo.svg` + favicon/app-icon variants), updating every call site listed above.

## 2. No fabricated platform content

Never invent platform statistics, counts, or social proof ("10,000 Startups", "₹100 Cr Raised", "Trusted by 200+ Companies") and never imply VittamHub already has active users, startups, investors, funding rounds, testimonials, or reviews it doesn't actually have.

Where sample/dev content is genuinely needed, label it unambiguously as demo content — "Demo Startup", "Demo Investor", "Example Company", "Coming Soon", "Preview" — so the UI never reads as a real, populated platform.

## 3. Startup → investor connect is the core loop

The platform supports the full startup lifecycle: Idea → Validation → Prototype → MVP → Early Customers → Revenue → Product-Market Fit → Seed → Series A → Series B → Growth → Expansion → Unicorn. `StartupStage` (`packages/types/src/domain/enums.ts`) already models this progression.

At every stage a startup should be able to: build a professional/verified profile, discover and save/follow investors, send connect requests, upload pitch decks, share updates/milestones, track conversations, and schedule meetings. Investors should be able to discover startups across every stage via filters and (future) AI recommendations.

## 4. Smart Connect Request system — no direct messaging

Founders can never message an investor directly. A founder must first send a **Connect Request** carrying: short introduction, startup summary, funding requirement, industry, stage, and optionally a pitch deck / executive summary. The investor can Accept, Decline, or Ignore. Only after Accept do both sides unlock chat, document sharing, pitch deck exchange, and meeting scheduling.

**Status**: built. The `Connection` model and `ConnectionsService` (`apps/api/src/modules/connections`) are the request and its state machine; messages and meeting proposals are refused (403) until the investor accepts, and the e2e suite (`test/security.e2e-spec.ts`) checks it. Attachments on a request (pitch deck, one-pager) live in private storage and are opened through a short-lived link only the two members can fetch. See docs/12-connect-requests.md.

## 5. Free plan limits, admin-configurable

Default Free Founder plan: 2 investor connect requests per month (lowered from 5 in November 2026). This limit must be configurable from an Admin Panel at runtime, not hardcoded — plan/limit data belongs in the database, not a constant.

Do **not** implement payment/billing logic for this yet — only build the plan/limit architecture so pricing tiers (more requests, unlimited discovery, advanced AI recommendations, higher visibility, priority listing, premium analytics, Startup Passport, verified badge, investor CRM tools) can be layered in later without a schema rewrite.

## 6. No manual human verification

This is an early-stage platform with no ops team to review submissions by hand. Never design a feature around a human approving/rejecting: startup or investor accounts, uploaded documents, trust scores, or profile content. Every verification-shaped feature must be an automated workflow (or an explicit "not yet automated, sits in a pending state" placeholder) — never a queue that assumes staff will clear it.

## 7. Document collection is for future automated verification

Uploads (Certificate of Incorporation, PAN, GST, CIN, DPIIT certificate, trademark/patent docs, government ID, business email, company website, LinkedIn) are collected now — see `Document`/`DocumentType` in `schema.prisma` and the founder wizard's `Step8Verification.tsx` — purely as inputs for *future* automated checks, profile-completeness scoring, trust indicators, and eligibility filters. Do not build manual-review UI around them; do not block a user's flow waiting on a human to look at them.

### 7a. Who a directory lists

Every published profile is listed in the directories and search from the start, verified first (`common/verification/listed-profiles.ts`: `LISTED_VERIFICATION` hides only REJECTED, `VERIFIED_FIRST` orders the rest). The owner chose this in November 2026 so new members are findable before their documents are in. "Verified" today means the required documents and details are present (the verification engine's per-type requirement lists, shown to the user in Settings via `GET /v1/verification/mine`), not that a registry has confirmed them.

## 8. Build for future automation, modularly

Design every module so these can be added later without a rewrite: AI fraud detection, MCA/GST/PAN verification APIs, domain and business-email verification, AI moderation, automated risk scoring, digital KYC, payment gateways. Keep integrations behind clean service boundaries (as `CaptchaService`, `EmailService`, `MediaService` already are — optional/pluggable, degrade gracefully when unconfigured) so a real verification provider can be dropped in later.

### 8a. How the code works today (things that are easy to break)

- **Uploads** go from the browser straight to Cloudflare R2 on a pre-signed **PUT** (R2 doesn't support presigned POST), signed with the file's content type and length. Public folders: `logos`, `avatars`, `pictures`; private: `documents`, `resumes`. The bucket needs the CORS rule in docs/10-deployment-infrastructure.md, and the web CSP's connect-src must include the storage origin.
- **Sessions**: the access token carries `sid`, the refresh-token family, and every request checks that the family is still live, so signing out or ending a session elsewhere takes effect at once.
- **Editing a published profile** reopens the onboarding wizard on the live profile; saving updates it in place (no second startup, no second signature), and unsaved edits can be discarded.
- **Mentor sessions** (`MentorBookingRequest`): a founder requests, the mentor accepts or declines, then the mentor sets the time, length and meeting link (`POST /v1/mentors/bookings/:id/schedule`), and either side marks it done once it has happened (`/complete`). Reviews and a mentor's "sessions completed" count only sessions marked done.
- **Demo accounts** are shared and re-seeded on every API boot; their password lives only in the `DEMO_ACCOUNTS_PASSWORD` env var. They can't upload government ID, PAN or a digital signature.
- **Code style**: there is no Prettier config, so don't run Prettier; fix lint with `eslint --fix`.
- **Stack**: Next.js 15 with React 19 (route `params` are Promises in server components), NestJS 10, Prisma 5.

## 9. Design philosophy

The product should read as trustworthy, transparent, innovative, professional, automated, scalable, and premium — without sacrificing simplicity for complexity that doesn't earn its keep.

## 9a. Visual direction (November 2026)

The owner's own blue is the brand colour: `brand-600` `#5F89C8` and its scale in `packages/tokens`, the same calm mid-blue family as the Goldman Sachs logo. A navy "trust blue" redesign was tried and rolled back at the owner's request, so don't bring it back. Keep pages light: white and light-grey sections, blue accents and blue gradient cards, and no near-black or navy bands anywhere, dashboards included (the owner asked for no black).

The home page is the original one (hero film, audience cards, journey, features as a product tour of real screens, how it works, example startups and investors, community, FAQ, closing card) and keeps its motion: fade-ups on scroll, the hero film and parallax, the marquee and hover lifts. Use pictures where a section needs one: real VittamHub screens captured on the demo accounts (`ProductShot`, `data/product-shots.ts`), or photos the owner provides, and never present a photo of people as VittamHub members (§2). The login and sign-up pages show the home page's film (`HeroFilm`) beside the form, not a product screen, at the owner's request. BCG careers (careers.bcg.com) stays a reference for layout ideas. See docs/02-design-system.md.

## 10. North star

VittamHub is the digital identity and discovery platform for startups — investors, mentors, incubators, universities, service providers, talent, and grants in one ecosystem, taking founders from Idea to Unicorn. Every feature decision should weigh trust, transparency, automation, scalability, security, performance, and premium UX.

## 11. Current scope (November 2026)

Until after the growth stage, the live platform covers six areas only: **founders, investors, mentors, incubators (and accelerators), universities, and community**. Everything else is paused, not abandoned:

- **Service providers and job seekers / jobs / founder hiring**: sign-up for both roles is closed (`REGISTERABLE_ROLES`), their pages are removed from the website, and `HiringModule` / `ServiceProvidersModule` are unregistered in `app.module.ts`. Their code and database tables stay, so bringing one back is re-registering its module and restoring its pages from git history.
- **Learning Hub**: removed. It will be rebuilt from the owner's own notes as a learning hub for entrepreneurs; don't restore the old placeholder tracks.
- **"Coming soon" modules list** (Startup Passport as a module, AI tools, marketplaces, grants, government schemes, office space and the rest of `FUTURE_MODULES`): removed from the dashboard. `FUTURE_MODULES` stays in `packages/types` as the roadmap.

Don't add new features outside the six areas without the owner asking.

**Public site (November 2026)**: the owner asked for the website to show only what is being worked on now: founders, investors, mentors and the community. The home features grid has four cards (startup profile, investor connect, mentorship, community); the ecosystem diagram, the Discover and Ecosystem menus, the pricing page (`/pricing` redirects to `/`, not permanently) and Trust Score, Startup Passport, verification and timeline cards are gone from the marketing pages. Incubator and university pages stay, linked from the footer only.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
