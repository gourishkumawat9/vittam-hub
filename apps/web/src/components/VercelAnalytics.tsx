"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

import { analyticsUrl } from "@/lib/analytics-url";

/** Strips secrets from the address before a page view is sent; see lib/analytics-url.ts. */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = analyticsUrl(event.url);
  return url ? { ...event, url } : null;
}

/**
 * Vercel Web Analytics: cookieless page-view counts, shown in the Vercel
 * dashboard once Web Analytics is switched on for the project. The script and
 * its reports are served from this site's own origin (/_vercel/insights), so
 * the CSP needs nothing extra in production. Nothing is recorded in
 * development. The privacy page (app/(marketing)/privacy) describes what it
 * records, so change that page if this changes.
 */
export function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
