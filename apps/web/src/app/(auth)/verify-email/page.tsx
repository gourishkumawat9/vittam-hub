"use client";

import { useConfirmVerificationEmail, useCurrentUser, useResendVerificationEmail } from "@vittamhub/api-client";
import { Button, OtpInput } from "@vittamhub/ui";
import { CheckCircle2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const confirmMutation = useConfirmVerificationEmail();
  const resendMutation = useResendVerificationEmail();
  const [code, setCode] = useState("");

  const handleComplete = (value: string) => {
    confirmMutation.mutate(
      { code: value },
      {
        onSuccess: (result) => {
          if (result.verified) {
            setTimeout(() => router.push("/onboarding"), 1200);
          }
        },
      },
    );
  };

  if (confirmMutation.data?.verified) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="h-6 w-6 text-success-600" />
          </span>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Email verified</h1>
          <p className="text-sm text-text-secondary">Taking you to onboarding…</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <MailCheck className="h-6 w-6 text-brand-700" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Verify your email</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            We sent a 6-digit code to <span className="font-medium text-text-primary">{user?.email}</span>
          </p>
        </div>

        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          error={confirmMutation.data && !confirmMutation.data.verified ? "Incorrect code — try again" : undefined}
          disabled={confirmMutation.isPending}
        />

        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {resendMutation.isSuccess ? "Code resent" : "Resend code"}
        </button>

        <Button variant="ghost" onClick={() => router.push("/onboarding")} className="text-text-secondary">
          Skip for now
        </Button>
      </div>
    </AuthCard>
  );
}
