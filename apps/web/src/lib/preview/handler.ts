/**
 * Answers the web app's API calls in dashboard preview mode (see ./mode.ts),
 * from the demo data in ./fixtures.ts. Reads are answered for whichever demo
 * role is being previewed; writes "succeed" without saving anything.
 */
import type { PaginatedResult } from "@vittamhub/types";

import * as F from "./fixtures";
import { currentPreviewRole, type PreviewRole } from "./mode";

type Json = unknown;

function page<T>(items: T[], query: URLSearchParams): PaginatedResult<T> {
  const pageNumber = Number(query.get("page") ?? 1) || 1;
  const pageSize = Number(query.get("pageSize") ?? 20) || 20;
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: pageNumber,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

/** Case-insensitive text filter on the `query` parameter, so the search boxes visibly do something. */
function byQuery<T>(items: T[], query: URLSearchParams, text: (item: T) => string): T[] {
  const q = query.get("query")?.trim().toLowerCase();
  return q ? items.filter((item) => text(item).toLowerCase().includes(q)) : items;
}

function readRoutes(role: PreviewRole, path: string, query: URLSearchParams): Json | undefined {
  const seg = path.split("/").filter(Boolean); // ["v1", ...]
  const [, area, a, b, c] = seg;

  switch (area) {
    case "auth":
      if (a === "me") return F.userFor(role);
      if (a === "sessions") return F.SESSIONS;
      if (a === "captcha-site-key") return { siteKey: null };
      if (a === "providers") return { providers: [] };
      if (a === "csrf") return { ok: true };
      return undefined;

    case "workspace":
      return F.WORKSPACE_HOME;

    case "analytics":
      return F.INVESTOR_ANALYTICS;

    case "recommendations":
      return role === "investor" ? F.INVESTOR_RECOMMENDATIONS : F.FOUNDER_RECOMMENDATIONS;

    case "startups":
      if (!a) {
        return page(byQuery(F.SEARCH_RESULTS, query, (s) => `${s.name} ${s.tagline} ${s.owner.fullName}`), query);
      }
      if (a === "me") {
        if (!b) return F.MY_STARTUP;
        if (b === "health") return F.STARTUP_HEALTH;
        if (b === "trust-preview") return F.TRUST_PREVIEW;
        if (b === "activity") return F.FOUNDER_ACTIVITY;
        if (b === "views") return F.PROFILE_VIEWS;
        if (b === "analytics") return F.FOUNDER_ANALYTICS;
        if (b === "benchmark") return F.BENCHMARK;
        return undefined;
      }
      if (b === "milestones") return F.startupProfileBySlug(a).milestones;
      if (b === "activity") return a === "demo-startup" ? F.FOUNDER_ACTIVITY : [];
      return F.startupProfileBySlug(a);

    case "investors":
      if (!a) return page(byQuery(F.INVESTORS, query, (i) => `${i.firmName} ${i.owner.fullName} ${i.bio}`), query);
      if (a === "me") {
        if (!b) return F.MY_INVESTOR;
        if (b === "co-investors") return F.CO_INVESTORS;
        if (b === "mandates") {
          if (!c) return F.MANDATES;
          if (seg[5] === "matches") return F.MANDATE_MATCHES;
          return F.MANDATES.find((m) => m.id === c) ?? F.MANDATES[0];
        }
        if (b === "saved-searches") {
          if (!c) return F.SAVED_SEARCHES;
          if (seg[5] === "run") return page(F.SEARCH_RESULTS.slice(0, 4), query);
          if (seg[5] === "new-count") return { count: c === F.SAVED_SEARCHES[0]!.id ? 2 : 0 };
          return F.SAVED_SEARCHES.find((s) => s.id === c);
        }
        return undefined;
      }
      return F.INVESTORS.find((i) => i.id === a) ?? F.INVESTORS[0];

    case "connections":
      if (!a) {
        const statuses = query.getAll("status");
        const mine = F.connectionsFor(role);
        return page(statuses.length ? mine.filter((c) => statuses.includes(c.status)) : mine, query);
      }
      if (a === "quota") return F.QUOTA;
      if (a === "meetings") return role === "founder" || role === "investor" ? F.MY_MEETINGS : [];
      if (b === "messages") return F.MESSAGES.filter((m) => m.connectionId === a);
      if (b === "meetings") return F.MEETINGS.filter((m) => m.connectionId === a);
      if (b === "attachments") return { url: "https://example.com/demo-deck.pdf" };
      return F.CONNECTIONS.find((c) => c.id === a);

    case "documents":
      if (!a) return F.documentsFor(role);
      if (a === "shared-with-me") return role === "investor" ? F.SHARED_WITH_ME : [];
      if (b === "grants") return F.DOCUMENT_GRANTS.filter((g) => g.documentId === a);
      if (b === "access") return { fileUrl: "https://example.com/demo-document.pdf", fileName: "Demo document.pdf", type: "OTHER" };
      return undefined;

    case "follows":
      if (a === "me" && b === "followers") return [];
      if (a === "me") return [];
      return { isFollowing: false };

    case "mentors":
      if (!a) return page(byQuery(F.MENTORS, query, (m) => `${m.owner.fullName} ${m.headline} ${m.expertise.join(" ")}`), query);
      if (a === "bookings") return F.bookingsFor(role);
      return F.MENTORS.find((m) => m.id === a) ?? F.MENTORS[0];

    case "incubators":
      if (!a) {
        const kinds = query.getAll("kind");
        const list = byQuery(F.INCUBATORS, query, (i) => `${i.organizationName} ${i.description}`);
        return page(kinds.length ? list.filter((i) => kinds.includes(i.kind)) : list, query);
      }
      return F.INCUBATORS.find((i) => i.id === a) ?? F.INCUBATORS[0];

    case "universities":
      if (!a) return page(byQuery(F.UNIVERSITIES, query, (u) => `${u.institutionName} ${u.incubationCellName}`), query);
      return F.UNIVERSITIES.find((u) => u.id === a) ?? F.UNIVERSITIES[0];

    case "pipeline":
      return F.PIPELINE;

    case "portfolio":
      if (a === "dashboard") return F.PORTFOLIO_DASHBOARD;
      return F.PORTFOLIO;

    case "watchlist":
      if (a === "triggers") return F.WATCHLIST_TRIGGERS;
      return F.WATCHLIST;

    case "notifications":
      if (a === "unread-count") return { count: F.notificationsFor(role).filter((n) => !n.readAt).length };
      return page(F.notificationsFor(role), query);

    case "community":
      if (a === "feed") {
        const types = query.getAll("type");
        let posts = types.length ? F.POSTS.filter((p) => types.includes(p.type)) : F.POSTS;
        if (query.get("bookmarkedOnly") === "true") posts = posts.filter((p) => p.isBookmarked);
        return page(posts, query);
      }
      if (a === "posts" && c === "comments") return F.commentsFor(b!);
      return undefined;

    case "search": {
      const q = (query.get("query") ?? "").toLowerCase();
      const has = (text: string) => !q || text.toLowerCase().includes(q);
      return {
        startups: F.SEARCH_RESULTS.filter((s) => has(`${s.name} ${s.tagline}`)).map(({ trustScore: _t, matchScore: _m, ...s }) => s),
        investors: F.INVESTORS.filter((i) => has(`${i.firmName} ${i.owner.fullName}`)),
        mentors: F.MENTORS.filter((m) => has(`${m.owner.fullName} ${m.headline}`)),
        incubators: F.INCUBATORS.filter((i) => has(i.organizationName)),
      };
    }

    case "verification":
      return F.verificationFor(role);

    case "onboarding":
      if (a === "state") return { status: "COMPLETED", step: 0, draft: F.onboardingDraftFor(role), pendingEdits: false };
      return undefined;

    case "admin":
      if (a === "system-health") return F.SYSTEM_HEALTH;
      if (a === "verification-overview") return F.VERIFICATION_OVERVIEW;
      if (a === "plan-limits") return F.PLAN_LIMITS;
      if (a === "users") {
        const roles = query.getAll("role");
        const list = byQuery(F.ADMIN_USERS, query, (u) => `${u.fullName} ${u.email}`);
        return page(roles.length ? list.filter((u) => roles.includes(u.role)) : list, query);
      }
      if (a === "analytics") {
        if (b === "totals") return { users: 6, startups: 8, investors: 4, connections: 5 };
        if (b === "signups") {
          const limit = Number(query.get("limit") ?? 12) || 12;
          return Array.from({ length: limit }, (_, i) => ({
            bucket: new Date(Date.now() - (limit - 1 - i) * 7 * 86_400_000).toISOString().slice(0, 10),
            count: [0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6][i % 12]!,
          }));
        }
        if (b === "connection-acceptance-rate") return { rate: 0.5, accepted: 1, declined: 1 };
        if (b === "verification-funnel")
          return [
            { stage: "UNVERIFIED", count: 3 },
            { stage: "PENDING", count: 3 },
            { stage: "VERIFIED", count: 17 },
            { stage: "REJECTED", count: 0 },
          ];
      }
      return undefined;

    case "jobs":
    case "service-providers":
      return a === "mine" || a === "applications" ? [] : page([], query);

    default:
      return undefined;
  }
}

/** What a write sends back. Nothing is stored; the reply only has to keep the screen moving. */
function writeReply(role: PreviewRole, path: string, body: Json): Json {
  const seg = path.split("/").filter(Boolean);
  const [, area, a, b] = seg;
  const echo = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const now = new Date().toISOString();

  if (area === "auth") {
    if (a === "login" || a === "mfa") return { mfaRequired: false, user: F.userFor(role) };
    if (a === "register") return { user: F.userFor(role), requiresEmailVerification: false };
    if (a === "logout") return null;
    return { ok: true, sent: true, verified: true, reset: true, changed: true, revoked: true, disabled: true };
  }
  if (area === "community") {
    if (b === "like" || seg[3] === "like") return { liked: true };
    if (b === "bookmark") return { bookmarked: true };
    if (b === "comments") return { ...F.commentsFor(a!)[0], body: echo.body ?? "", createdAt: now };
    return { id: "00000000-0000-4000-8999-000000000001", deleted: true };
  }
  if (area === "connections" && b === "messages") {
    return { id: `preview-${Date.now()}`, connectionId: a, senderId: F.userIdFor(role), body: echo.body ?? "", attachmentUrl: null, readAt: null, createdAt: now };
  }
  if (area === "connections" && b === "respond") {
    const action = echo.action as string | undefined;
    const existing = F.CONNECTIONS.find((c) => c.id === a) ?? F.CONNECTIONS[0]!;
    return { ...existing, status: action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "IGNORED", respondedAt: now };
  }
  if (area === "onboarding") return { saved: true, step: 0, discarded: true, id: F.STARTUPS[0]!.id };
  if (area === "media") return { uploadUrl: "https://preview-api.invalid/upload", uploadHeaders: {}, publicUrl: "https://example.com/demo-upload.png" };
  return { id: `preview-${Date.now()}`, ...echo, createdAt: now, updatedAt: now };
}

export type PreviewReply = { status: number; data: Json };

export function handlePreviewRequest(method: string, url: URL, body: Json): PreviewReply {
  const role = currentPreviewRole();
  const path = url.pathname;
  if (path === "/health") return { status: 200, data: { status: "ok" } };

  if (method === "GET") {
    const data = readRoutes(role, path, url.searchParams);
    if (data === undefined) {
      console.warn(`[preview] no demo data for GET ${path}`);
      return { status: 404, data: null };
    }
    return { status: 200, data };
  }
  return { status: 200, data: writeReply(role, path, body) };
}
