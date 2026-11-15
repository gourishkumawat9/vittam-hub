"use client";

import { type User } from "@vittamhub/types";
import { Avatar, Badge, Card } from "@vittamhub/ui";
import Link from "next/link";

import { editProfileLink } from "@/lib/role-home";

const ROLE_LABEL: Record<string, string> = {
  FOUNDER: "Founder",
  INVESTOR: "Investor",
  MENTOR: "Mentor",
  INCUBATOR: "Incubator or accelerator",
  UNIVERSITY: "University",
  ADMIN: "Administrator",
};

export function AccountSection({ user }: { user: User }) {
  const editProfile = editProfileLink(user.role);

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-heading text-base font-semibold text-text-primary">Account</h2>

      <div className="flex items-center gap-4">
        <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{user.fullName}</p>
          <p className="truncate text-sm text-text-secondary">{ROLE_LABEL[user.role] ?? "Member"}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <dt className="text-text-secondary">Email</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-medium text-text-primary">{user.email}</span>
            {user.emailVerifiedAt ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <>
                <Badge variant="warning">Not verified</Badge>
                {!user.isDemo && (
                  <Link href="/verify-email" className="font-medium text-brand-700 underline-offset-2 hover:underline">
                    Verify now
                  </Link>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>

      {editProfile && (
        <p className="border-t border-border pt-4 text-sm text-text-secondary">
          Your name, photo and everything on your public profile are changed in{" "}
          <Link href={editProfile.href} className="font-medium text-brand-700 underline-offset-2 hover:underline">
            {editProfile.label}
          </Link>
          .
        </p>
      )}
    </Card>
  );
}
