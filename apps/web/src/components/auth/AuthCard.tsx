import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";

/** Centered single-card auth layout — forgot/reset password, email verification, MFA setup. Login/register use their own two-column layout instead. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-card border border-border bg-surface p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
