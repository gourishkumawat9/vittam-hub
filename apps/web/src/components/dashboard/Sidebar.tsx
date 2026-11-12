"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import {
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Compass,
  FolderLock,
  GraduationCap,
  Inbox,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Network,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ROLE_NAV: Record<string, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  FOUNDER: [
    { href: "/founder", label: "Dashboard", icon: LayoutDashboard },
    { href: "/founder/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/founder/documents", label: "Documents", icon: FolderLock },
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/mentors/bookings", label: "Session Requests", icon: CalendarClock },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/community", label: "Community", icon: Users },
  ],
  MENTOR: [
    { href: "/mentors/bookings", label: "Session Requests", icon: CalendarClock },
    { href: "/community", label: "Community", icon: Users },
  ],
  INVESTOR: [
    { href: "/investor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/investor/discover", label: "Discover Startups", icon: Compass },
    { href: "/investor/portfolio", label: "My Portfolio", icon: Briefcase },
    { href: "/investor/requests", label: "Connection Requests", icon: Inbox },
    { href: "/investor/watchlist?tab=saved", label: "Saved Startups", icon: Bookmark },
    { href: "/investor/watchlist?tab=watchlist", label: "Watchlist", icon: Sparkles },
    { href: "/investor/watchlist?tab=triggers", label: "Watchlist Alerts", icon: Bell },
    { href: "/investor/meetings", label: "Meetings", icon: Calendar },
    { href: "/investor/messages", label: "Messages", icon: MessageCircle },
    { href: "/investor/pipeline", label: "Investment Pipeline", icon: Kanban },
    { href: "/investor/mandates", label: "Mandates", icon: Target },
    { href: "/investor/saved-searches", label: "Saved Searches", icon: Search },
    { href: "/investor/co-investors", label: "Co-Investor Graph", icon: Network },
    { href: "/investor/recommendations", label: "AI Recommendations", icon: Sparkles },
    { href: "/investor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/investor/documents", label: "Documents", icon: FolderLock },
    { href: "/investor/profile", label: "Profile", icon: UserCircle },
    { href: "/investor/settings", label: "Settings", icon: Settings },
    { href: "/community", label: "Community", icon: Users },
  ],
  ADMIN: [{ href: "/admin", label: "Admin", icon: Shield }],
  INCUBATOR: [
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/community", label: "Community", icon: Users },
  ],
  UNIVERSITY: [
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/community", label: "Community", icon: Users },
  ],
};

/** Roles paused until after the growth stage (service providers, job seekers) keep a way into the community. */
const FALLBACK_NAV = [{ href: "/community", label: "Community", icon: Users }];

/**
 * Nav content shared by the persistent desktop `<aside>` and the mobile
 * `Drawer` (see Topbar) — one implementation, one place to add a nav item.
 * `onNavigate` is only passed by the mobile drawer, to close it on click.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();

  const primaryNav = user ? (ROLE_NAV[user.role] ?? FALLBACK_NAV) : [];

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Dashboard">
      {primaryNav.map((item) => {
        const isActive = pathname === item.href.split("?")[0];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-button px-3 py-2 text-sm font-medium transition-colors",
              // The active page gets a blue bar on its left edge as well as the tinted pill.
              "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-primary before:opacity-0",
              isActive
                ? "bg-brand-100 font-semibold text-brand-700 before:opacity-100 dark:bg-brand-primary/15 dark:text-brand-primary"
                : "text-text-secondary hover:bg-text-primary/5 hover:text-text-primary",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return <SidebarNav />;
}
