"use client";

import { useConfirmVerificationEmail, useCurrentUser, useResendVerificationEmail } from "@vittamhub/api-client";
import { Button, OtpInput } from "@vittamhub/ui";
import { CheckCircle2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const confirmMutation = useConfirmVerificationEmail();
  const resendMutation = useResendVerificationEmail();
  const [code, setCode] = useState("");

  // The code belongs to an account, so this page needs someone signed in.
  // A signed-out visitor used to get "We sent a 6-digit code to" followed by nothing.
  const signedOut = !isLoading && (isError || !user);
  useEffect(() => {
    if (signedOut) router.replace("/login?redirectTo=/verify-email");
  }, [signedOut, router]);

  const justVerified = confirmMutation.data?.verified === true;
  useEffect(() => {
    if (!justVerified) return;
    // /onboarding sends each person to the right place: the wizard, or their dashboard once it is done.
    const timer = setTimeout(() => router.push("/onboarding"), 1200);
    return () => clearTimeout(timer);
  }, [justVerified, router]);

  // "A new code is on its way" for half a minute, then the button can be used again.
  const resent = resendMutation.isSuccess;
  const resetResend = resendMutation.reset;
  useEffect(() => {
    if (!resent) return;
    const timer = setTimeout(resetResend, 30_000);
    return () => clearTimeout(timer);
  }, [resent, resetResend]);

  const handleComplete = (value: string) => {
    confirmMutation.mutate({ code: value });
  };

  if (isLoading || signedOut || !user) {
    return (
      <AuthShell>
        <div className="flex justify-center py-10" aria-busy="true" aria-label="Loading">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
        </div>
      </AuthShell>
    );
  }

  if (justVerified || user.emailVerifiedAt) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="h-6 w-6 text-success-600" />
          </span>
          <h1 className="font-heading text-xl font-semibold text-text-primary">
            {justVerified ? "Email verified" : "Your email is already verified"}
          </h1>
          {justVerified ? (
            <p className="text-sm text-text-secondary">Taking you to your account…</p>
          ) : (
            <Button asChild>
              <Link href="/onboarding">Continue</Link>
            </Button>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <MailCheck className="h-6 w-6 text-brand-700" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Verify your email</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Enter the 6-digit code we sent to <span className="font-medium text-text-primary">{user.email}</span>
          </p>
        </div>

        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          error={confirmMutation.data && !confirmMutation.data.verified ? "Incorrect code. Try again" : undefined}
          disabled={confirmMutation.isPending}
        />

        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-text-secondary">No email, or the code has expired?</p>
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending || resendMutation.isSuccess}
            className="text-sm font-medium text-brand-primary hover:underline disabled:no-underline disabled:opacity-60"
          >
            {resendMutation.isSuccess ? "A new code is on its way" : resendMutation.isPending ? "Sending…" : "Send a new code"}
          </button>
        </div>

        <Button variant="ghost" onClick={() => router.push("/onboarding")} className="text-text-secondary">
          Skip for now
        </Button>
      </div>
    </AuthShell>
  );
}
