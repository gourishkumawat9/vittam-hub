import { PREVIEW_API_BASE, type PreviewRole } from "./mode";

/** The connection the demo founder and demo investor share, so the chat page has something in it. */
const DEMO_CONNECTION = "/connections/00000000-0000-4000-8008-000000000001";

export type PreviewArea = { role: PreviewRole; title: string; summary: string; pages: { label: string; href: string }[] };

/** Every screen the preview can show, grouped by who sees it. Links carry `?as=` so each one opens as the right demo account. */
export const PREVIEW_AREAS: PreviewArea[] = [
  {
    role: "founder",
    title: "Founder",
    summary: "Demo Founder, running Demo Startup (EdTech, MVP).",
    pages: [
      { label: "Dashboard", href: "/founder" },
      { label: "Analytics", href: "/founder/analytics" },
      { label: "Documents", href: "/founder/documents" },
      { label: "Chat with an investor (after Accept)", href: DEMO_CONNECTION },
      { label: "Find mentors", href: "/mentors" },
      { label: "Mentor session requests", href: "/mentors/bookings" },
      { label: "Incubators", href: "/incubators" },
      { label: "Universities", href: "/universities" },
      { label: "Community", href: "/community" },
      { label: "Search", href: "/search?query=demo" },
      { label: "Public startup profile", href: "/startups/demo-startup" },
      { label: "Edit startup profile (wizard)", href: "/onboarding/founder" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    role: "investor",
    title: "Investor",
    summary: "Demo Investor at Demo Angel Fund.",
    pages: [
      { label: "Dashboard", href: "/investor" },
      { label: "Discover startups", href: "/investor/discover" },
      { label: "Connection requests", href: "/investor/requests" },
      { label: "Portfolio", href: "/investor/portfolio" },
      { label: "Saved startups", href: "/investor/watchlist?tab=saved" },
      { label: "Watchlist", href: "/investor/watchlist?tab=watchlist" },
      { label: "Watchlist alerts", href: "/investor/watchlist?tab=triggers" },
      { label: "Meetings", href: "/investor/meetings" },
      { label: "Messages", href: "/investor/messages" },
      { label: "Chat with a founder", href: DEMO_CONNECTION },
      { label: "Investment pipeline", href: "/investor/pipeline" },
      { label: "Mandates", href: "/investor/mandates" },
      { label: "Saved searches", href: "/investor/saved-searches" },
      { label: "Co-investor graph", href: "/investor/co-investors" },
      { label: "AI recommendations", href: "/investor/recommendations" },
      { label: "Analytics", href: "/investor/analytics" },
      { label: "Documents", href: "/investor/documents" },
      { label: "Community", href: "/community" },
      { label: "Edit investor profile", href: "/investor/profile" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    role: "mentor",
    title: "Mentor",
    summary: "Demo Mentor, product and pricing.",
    pages: [
      { label: "Session requests", href: "/mentors/bookings" },
      { label: "Mentors directory", href: "/mentors" },
      { label: "Community", href: "/community" },
      { label: "Edit mentor profile (wizard)", href: "/onboarding/mentor" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    role: "incubator",
    title: "Incubator / accelerator",
    summary: "Demo Incubator with a pre-incubation programme.",
    pages: [
      { label: "Incubators directory", href: "/incubators" },
      { label: "Mentors", href: "/mentors" },
      { label: "Universities", href: "/universities" },
      { label: "Community", href: "/community" },
      { label: "Edit incubator profile (wizard)", href: "/onboarding/incubator" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    role: "university",
    title: "University",
    summary: "Demo University Startup Cell.",
    pages: [
      { label: "Universities directory", href: "/universities" },
      { label: "Mentors", href: "/mentors" },
      { label: "Incubators", href: "/incubators" },
      { label: "Community", href: "/community" },
      { label: "Edit university profile (wizard)", href: "/onboarding/university" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    role: "admin",
    title: "Admin",
    summary: "The admin panel, with made-up platform numbers.",
    pages: [
      { label: "Admin panel", href: "/admin" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

/** Adds `?as=<role>` (keeping any query already on the link). */
export function asRole(href: string, role: PreviewRole): string {
  const url = new URL(href, PREVIEW_API_BASE);
  url.searchParams.set("as", role);
  return `${url.pathname}${url.search}`;
}
