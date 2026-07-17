"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import { FUTURE_MODULES } from "@vittamhub/types";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  ChevronDown,
  Compass,
  FolderLock,
  GraduationCap,
  Inbox,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { FUTURE_MODULE_ICONS } from "@/data/future-modules";
import { cn } from "@/lib/utils";

const ROLE_NAV: Record<string, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  FOUNDER: [
    { href: "/founder", label: "Dashboard", icon: LayoutDashboard },
    { href: "/founder/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/founder/hiring", label: "Hiring", icon: Briefcase },
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/mentors/bookings", label: "Session Requests", icon: CalendarClock },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/learning", label: "Learning", icon: BookOpen },
    { href: "/community", label: "Community", icon: Users },
  ],
  MENTOR: [
    { href: "/mentors/bookings", label: "Session Requests", icon: CalendarClock },
    { href: "/learning", label: "Learning", icon: BookOpen },
    { href: "/community", label: "Community", icon: Users },
  ],
  JOB_SEEKER: [
    { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
    { href: "/learning", label: "Learning", icon: BookOpen },
    { href: "/community", label: "Community", icon: Users },
  ],
  INVESTOR: [
    { href: "/investor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/investor/discover", label: "Discover Startups", icon: Compass },
    { href: "/investor/portfolio", label: "My Portfolio", icon: Briefcase },
    { href: "/investor/requests", label: "Connection Requests", icon: Inbox },
    { href: "/investor/watchlist?tab=saved", label: "Saved Startups", icon: Bookmark },
    { href: "/investor/watchlist?tab=watchlist", label: "Watchlist", icon: Sparkles },
    { href: "/investor/meetings", label: "Meetings", icon: Calendar },
    { href: "/investor/messages", label: "Messages", icon: MessageCircle },
    { href: "/investor/pipeline", label: "Investment Pipeline", icon: Kanban },
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
    { href: "/service-providers", label: "Service Providers", icon: Briefcase },
    { href: "/community", label: "Community", icon: Users },
  ],
  UNIVERSITY: [
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/service-providers", label: "Service Providers", icon: Briefcase },
    { href: "/community", label: "Community", icon: Users },
  ],
  SERVICE_PROVIDER: [
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/service-providers", label: "Service Providers", icon: Briefcase },
    { href: "/community", label: "Community", icon: Users },
  ],
};

export function Sidebar() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const [showFuture, setShowFuture] = useState(false);

  const primaryNav = user ? (ROLE_NAV[user.role] ?? []) : [];

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4" aria-label="Dashboard">
      {primaryNav.map((item) => {
        const isActive = pathname === item.href.split("?")[0];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-button px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-brand-100 text-brand-700" : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setShowFuture((v) => !v)}
        className="mt-4 flex items-center justify-between rounded-button px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:bg-background-secondary"
      >
        Coming soon
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFuture && "rotate-180")} />
      </button>
      {showFuture && (
        <div className="flex flex-col gap-0.5 pl-1">
          {FUTURE_MODULES.map((module) => {
            const Icon = FUTURE_MODULE_ICONS[module.slug]!;
            return (
              <Link
                key={module.slug}
                href={`/modules/${module.slug}`}
                className="flex items-center gap-2.5 rounded-button px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{module.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
