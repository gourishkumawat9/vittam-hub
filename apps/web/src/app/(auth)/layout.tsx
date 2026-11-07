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
