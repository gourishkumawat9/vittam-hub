"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import { Card, Skeleton } from "@vittamhub/ui";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountSection } from "@/components/settings/AccountSection";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { SessionsSection } from "@/components/settings/SessionsSection";
import { VerificationSection } from "@/components/settings/VerificationSection";

/**
 * One settings page for every kind of account. Before this only investors
 * had one (most of it "Coming soon" placeholders), so a founder, mentor,
 * incubator or university had no way to change a password, see where they
 * were signed in, or delete their account.
 */
export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="heading-5">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Your account, your Verified badge, how you sign in, and where you&apos;re signed in.</p>
      </div>

      {user.isDemo && (
        <p className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-text-primary" role="note">
          This is a shared demo account for trying VittamHub. Its password, sign-ins and the account itself can&apos;t be
          changed. Create your own account to use these settings.
        </p>
      )}

      <AccountSection user={user} />
      <VerificationSection user={user} />
      {!user.isDemo && <PasswordSection hasPassword={user.hasPassword !== false} />}
      <SessionsSection isDemo={user.isDemo === true} />

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">Appearance</h2>
          <p className="mt-1 text-sm text-text-secondary">Switch between the light and dark theme on this device.</p>
        </div>
        <ThemeToggle />
      </Card>

      {!user.isDemo && <DeleteAccountSection hasPassword={user.hasPassword !== false} />}
    </div>
  );
}
