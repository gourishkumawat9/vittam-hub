"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import { Avatar, Card, Skeleton } from "@vittamhub/ui";
import { KeyRound, Laptop, Palette, ShieldCheck, Trash2, UserRound } from "@vittamhub/ui/icons";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AccountSection } from "@/components/settings/AccountSection";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { SessionsSection } from "@/components/settings/SessionsSection";
import { VerificationSection } from "@/components/settings/VerificationSection";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  FOUNDER: "Founder",
  INVESTOR: "Investor",
  MENTOR: "Mentor",
  INCUBATOR: "Incubator",
  UNIVERSITY: "University",
  ADMIN: "Admin",
};

/** Highlights the section the reader is looking at, so the side list doubles as a "you are here". */
function useActiveSection(ids: string[], ready: boolean) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    key.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [key, ready]);
  return active;
}

/**
 * One settings page for every kind of account, laid out like a product's
 * settings: the sections listed on the left (on wide screens), each one a
 * panel on the right.
 */
export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();

  const sections = [
    { id: "account", label: "Account", icon: UserRound },
    { id: "verification", label: "Verified badge", icon: ShieldCheck },
    ...(user && !user.isDemo ? [{ id: "password", label: "Password", icon: KeyRound }] : []),
    { id: "sessions", label: "Signed-in devices", icon: Laptop },
    { id: "appearance", label: "Appearance", icon: Palette },
    ...(user && !user.isDemo ? [{ id: "delete", label: "Delete account", icon: Trash2 }] : []),
  ];
  const active = useActiveSection(
    sections.map((section) => section.id),
    !!user,
  );

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-60" />
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="hidden h-64 lg:col-span-3 lg:block" />
          <div className="flex flex-col gap-6 lg:col-span-9">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Your account, your Verified badge, how you sign in, and where you're signed in." />

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <nav aria-label="Settings sections" className="hidden flex-col gap-4 lg:sticky lg:top-24 lg:col-span-3 lg:flex">
          <div className="flex items-center gap-3 px-3">
            <Avatar name={user.fullName} src={user.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="body-5 truncate text-text-primary">{user.fullName}</p>
              <p className="caption-5">{ROLE_LABEL[user.role] ?? "Member"}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active === section.id ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-button px-3 py-2 text-sm font-medium transition-colors",
                    active === section.id
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                      : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
                    section.id === "delete" && active !== section.id && "text-danger-600 hover:text-danger-600",
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-9 xl:col-span-8">
          {user.isDemo && (
            <p className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-text-primary dark:border-brand-800 dark:bg-brand-950/40" role="note">
              This is a shared demo account for trying VittamHub. Its password, sign-ins and the account itself can&apos;t be changed. Create your own
              account to use these settings.
            </p>
          )}

          <div id="account" className="scroll-mt-24">
            <AccountSection user={user} />
          </div>
          {/* VerificationSection carries its own id="verification" anchor, which other pages link to. */}
          <VerificationSection user={user} />
          {!user.isDemo && (
            <div id="password" className="scroll-mt-24">
              <PasswordSection hasPassword={user.hasPassword !== false} />
            </div>
          )}
          <div id="sessions" className="scroll-mt-24">
            <SessionsSection isDemo={user.isDemo === true} />
          </div>
          <div id="appearance" className="scroll-mt-24">
            <Card className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-text-primary">Appearance</h2>
                <p className="mt-1 text-sm text-text-secondary">Switch between the light and dark theme on this device.</p>
              </div>
              <ThemeToggle />
            </Card>
          </div>
          {!user.isDemo && (
            <div id="delete" className="scroll-mt-24">
              <DeleteAccountSection hasPassword={user.hasPassword !== false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
