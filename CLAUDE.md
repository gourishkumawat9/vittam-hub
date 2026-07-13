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

**Status**: not yet built. This is a real architectural addition (new `ConnectRequest` model/state machine gating an existing or future messaging module), not a UI-only feature — it needs its own schema, service, and guard logic before any founder↔investor messaging ships.

## 5. Free plan limits, admin-configurable

Default Free Founder plan: 5 investor connect requests per month. This limit must be configurable from an Admin Panel at runtime, not hardcoded — plan/limit data belongs in the database, not a constant.

Do **not** implement payment/billing logic for this yet — only build the plan/limit architecture so pricing tiers (more requests, unlimited discovery, advanced AI recommendations, higher visibility, priority listing, premium analytics, Startup Passport, verified badge, investor CRM tools) can be layered in later without a schema rewrite.

## 6. No manual human verification

This is an early-stage platform with no ops team to review submissions by hand. Never design a feature around a human approving/rejecting: startup or investor accounts, uploaded documents, trust scores, or profile content. Every verification-shaped feature must be an automated workflow (or an explicit "not yet automated, sits in a pending state" placeholder) — never a queue that assumes staff will clear it.

## 7. Document collection is for future automated verification

Uploads (Certificate of Incorporation, PAN, GST, CIN, DPIIT certificate, trademark/patent docs, government ID, business email, company website, LinkedIn) are collected now — see `Document`/`DocumentType` in `schema.prisma` and the founder wizard's `Step8Verification.tsx` — purely as inputs for *future* automated checks, profile-completeness scoring, trust indicators, and eligibility filters. Do not build manual-review UI around them; do not block a user's flow waiting on a human to look at them.

## 8. Build for future automation, modularly

Design every module so these can be added later without a rewrite: AI fraud detection, MCA/GST/PAN verification APIs, domain and business-email verification, AI moderation, automated risk scoring, digital KYC, payment gateways. Keep integrations behind clean service boundaries (as `CaptchaService`, `EmailService`, `MediaService` already are — optional/pluggable, degrade gracefully when unconfigured) so a real verification provider can be dropped in later.

## 9. Design philosophy

The product should read as trustworthy, transparent, innovative, professional, automated, scalable, and premium — without sacrificing simplicity for complexity that doesn't earn its keep.

## 10. North star

VittamHub is the digital identity and discovery platform for startups — investors, mentors, incubators, universities, service providers, talent, and grants in one ecosystem, taking founders from Idea to Unicorn. Every feature decision should weigh trust, transparency, automation, scalability, security, performance, and premium UX.
