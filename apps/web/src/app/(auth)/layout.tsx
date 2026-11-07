import type { Metadata } from "next";

import { NO_INDEX } from "@/lib/seo";

/** Password-reset and email-verification links are one-off and private. /login and /register opt back in to indexing in their own layouts. */
export const metadata: Metadata = { robots: NO_INDEX };

/**
 * Auth shell: login, register, forgot-password, verify-email, onboarding.
 * Deliberately chrome-free (no nav/footer) so first impressions stay focused.
 * Intentionally unopinionated about card vs. full-bleed layout — login/register
 * need a two-column illustration layout, while forgot-password etc. use a
 * centered card — so each page owns its own container instead of this layout
 * forcing one shape on everything.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background-secondary">{children}</div>;
}
