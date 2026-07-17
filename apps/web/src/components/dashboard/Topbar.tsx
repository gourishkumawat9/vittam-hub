"use client";

import { useCurrentUser, useLogout } from "@vittamhub/api-client";
import { Avatar } from "@vittamhub/ui";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";

export function Topbar() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/login");
  };

  return (
    <div className="flex h-full items-center justify-between gap-4 px-6">
      <Logo height={28} />

      <div className="hidden flex-1 justify-center sm:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        {user && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-button px-2 py-1.5 hover:bg-background-secondary"
            >
              <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-dropdown w-56 rounded-card border border-border bg-surface shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-text-primary">{user.fullName}</p>
                  <p className="truncate text-xs text-text-secondary">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-background-secondary"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
