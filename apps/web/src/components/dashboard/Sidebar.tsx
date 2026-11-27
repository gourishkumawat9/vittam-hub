"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import {
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  ChevronDown,
  Compass,
  FolderLock,
  GraduationCap,
  Handshake,
  Inbox,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Network,
  School,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label?: string; items: NavItem[]; /** Folded away until opened, or until one of its pages is open. */ collapsible?: boolean };

const SETTINGS: NavItem = { href: "/settings", label: "Settings", icon: Settings };
const COMMUNITY: NavItem = { href: "/community", label: "Community", icon: Users };
const DIRECTORIES: NavGroup = {
  label: "Ecosystem",
  items: [
    { href: "/mentors", label: "Mentors", icon: GraduationCap },
    { href: "/incubators", label: "Incubators", icon: Building2 },
    { href: "/universities", label: "Universities", icon: School },
    COMMUNITY,
  ],
};

/**
 * Each role's navigation, in labelled groups. Every role starts at a Home
 * page; editing a public profile lives in the account menu (Topbar) and in
 * Settings, so it doesn't take a nav slot.
 */
const ROLE_NAV: Record<string, NavGroup[]> = {
  FOUNDER: [
    { items: [{ href: "/founder", label: "Home", icon: LayoutDashboard }] },
    {
      label: "Fundraising",
      items: [
        { href: "/founder/investors", label: "Investors", icon: Handshake },
        { href: "/founder/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/founder/documents", label: "Documents", icon: FolderLock },
      ],
    },
    {
      label: "Support",
      items: [
        { href: "/mentors", label: "Mentors", icon: GraduationCap },
        { href: "/mentors/bookings", label: "Mentor sessions", icon: CalendarClock },
        { href: "/incubators", label: "Incubators", icon: Building2 },
        { href: "/universities", label: "Universities", icon: School },
        COMMUNITY,
      ],
    },
    { items: [SETTINGS] },
  ],
  INVESTOR: [
    { items: [{ href: "/investor", label: "Home", icon: LayoutDashboard }] },
    {
      label: "Deal flow",
      items: [
        { href: "/investor/discover", label: "Discover startups", icon: Compass },
        { href: "/investor/requests", label: "Connect requests", icon: Inbox },
        { href: "/investor/pipeline", label: "Pipeline", icon: Kanban },
        { href: "/investor/watchlist", label: "Watchlist", icon: Bookmark },
      ],
    },
    {
      label: "Relationships",
      items: [
        { href: "/investor/meetings", label: "Meetings", icon: Calendar },
        { href: "/investor/messages", label: "Messages", icon: MessageCircle },
        { href: "/investor/portfolio", label: "Portfolio", icon: Briefcase },
      ],
    },
    {
      label: "More",
      collapsible: true,
      items: [
        { href: "/investor/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/investor/recommendations", label: "Recommendations", icon: Sparkles },
        { href: "/investor/mandates", label: "Mandates", icon: Target },
        { href: "/investor/saved-searches", label: "Saved searches", icon: Search },
        { href: "/investor/co-investors", label: "Co-investors", icon: Network },
        { href: "/investor/documents", label: "Documents", icon: FolderLock },
        { href: "/investor/profile", label: "Your profile", icon: UserRound },
      ],
    },
    { items: [COMMUNITY, SETTINGS] },
  ],
  MENTOR: [
    {
      items: [
        { href: "/home", label: "Home", icon: LayoutDashboard },
        { href: "/mentors/bookings", label: "Sessions", icon: CalendarClock },
      ],
    },
    DIRECTORIES,
    { items: [SETTINGS] },
  ],
  INCUBATOR: [{ items: [{ href: "/home", label: "Home", icon: LayoutDashboard }] }, DIRECTORIES, { items: [SETTINGS] }],
  UNIVERSITY: [{ items: [{ href: "/home", label: "Home", icon: LayoutDashboard }] }, DIRECTORIES, { items: [SETTINGS] }],
  ADMIN: [{ items: [{ href: "/admin", label: "Admin", icon: Shield }, SETTINGS] }],
};

/** Roles paused until after the growth stage (service providers, job seekers) keep a way into the community. */
const FALLBACK_NAV: NavGroup[] = [{ items: [COMMUNITY, SETTINGS] }];

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-button px-3 py-2 text-sm transition-colors duration-300 ease-base",
        active
          ? "bg-brand-100 font-semibold text-brand-800 dark:bg-brand-primary/15 dark:text-brand-200"
          : "font-medium text-text-secondary hover:bg-text-primary/5 hover:text-text-primary",
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-700 dark:text-brand-300" : "")} aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Nav content shared by the persistent desktop `<aside>` and the mobile
 * `Drawer` (see Topbar) — one implementation, one place to add a nav item.
 * `onNavigate` is only passed by the mobile drawer, to close it on click.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();

  const groups = user ? (ROLE_NAV[user.role] ?? FALLBACK_NAV) : [];
  // The most specific match wins, so /mentors/bookings doesn't also light up /mentors.
  const allHrefs = groups.flatMap((group) => group.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4" aria-label="Dashboard">
      {groups.map((group, index) => {
        const links = (
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={item.href === activeHref} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        );
        const key = group.label ?? `group-${index}`;
        if (group.collapsible && group.label) {
          const holdsActive = group.items.some((item) => item.href === activeHref);
          return (
            <details key={key} open={holdsActive || undefined} className="group/more flex flex-col gap-1">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-button px-3 py-1 text-xs font-semibold text-text-secondary transition-colors duration-300 ease-base hover:text-text-primary [&::-webkit-details-marker]:hidden">
                {group.label}
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 ease-base group-open/more:rotate-180" aria-hidden="true" />
              </summary>
              <div className="pt-1">{links}</div>
            </details>
          );
        }
        return (
          <div key={key} className="flex flex-col gap-1">
            {group.label && <p className="px-3 text-xs font-semibold text-text-secondary">{group.label}</p>}
            {links}
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return <SidebarNav />;
}
