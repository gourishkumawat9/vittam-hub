import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

/**
 * Authenticated shell shared by founder/investor/admin surfaces: persistent
 * sidebar nav + topbar. Role-specific navigation items are computed from the
 * session role inside <Sidebar />, not by branching layouts, so the chrome
 * (and its animations) stays a single implementation.
 *
 * Auth gate itself lives in `middleware.ts`, not here — this layout can
 * assume a valid session by the time it renders.
 *
 * The sidebar is a light panel with the logo on top and stays in view while
 * the page scrolls; the topbar is frosted glass over a light grey canvas, in
 * the same blue as the website.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col">
          <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
            <Logo height={26} />
          </div>
          <Sidebar />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nav-blur sticky top-0 z-stickyNav h-16 border-b border-border">
          <Topbar />
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
