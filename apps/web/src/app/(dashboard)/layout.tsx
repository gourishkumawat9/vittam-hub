/**
 * Authenticated shell shared by founder/investor/admin surfaces: persistent
 * sidebar nav + topbar. Role-specific navigation items are computed from the
 * session role inside <Sidebar />, not by branching layouts, so the chrome
 * (and its animations) stays a single implementation.
 *
 * Auth gate itself lives in `middleware.ts`, not here — this layout can
 * assume a valid session by the time it renders.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        {/* TODO: <Sidebar /> */}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nav-blur sticky top-0 z-stickyNav h-16">{/* TODO: <Topbar /> */}</header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
