"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCaptchaSiteKey, useCompleteMfaChallenge, useLogin } from "@vittamhub/api-client";
import { loginInputSchema, type LoginInput } from "@vittamhub/types";
import { Button, Checkbox, Input, OtpInput, PasswordInput } from "@vittamhub/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { SecurityBadges } from "@/components/auth/SecurityBadges";
import { Turnstile } from "@/components/auth/Turnstile";
import { safeInternalPath } from "@/lib/safe-url";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_unavailable: "That sign-in option isn't available right now. Use your email and password instead.",
  oauth_email:
    "We couldn't get a verified email address from that account. Verify your email with the provider, or use your email and password.",
  oauth_closed: "That account has been deleted. You can create a new one.",
  oauth_failed: "That sign-in didn't complete. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The address bar is the only source of this value, so anyone can put anything in it: keep in-app paths only.
  const redirectTo = safeInternalPath(searchParams.get("redirectTo"), "/onboarding");

  const { data: captcha } = useCaptchaSiteKey();
  const loginMutation = useLogin();
  const mfaMutation = useCompleteMfaChallenge();

  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);

  // A Google / GitHub / LinkedIn sign-in that didn't go through comes back here with a short reason code.
  const oauthError = OAUTH_ERRORS[searchParams.get("error") ?? ""];

  // An account with two-factor on that signed in through a provider arrives
  // with its challenge in the address fragment: pick it up, then remove it
  // from the address bar so it isn't bookmarked or shared.
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("mfa");
    if (!token) return;
    setMfaChallengeToken(token);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = handleSubmit((data) => {
    loginMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.mfaRequired) {
          setMfaChallengeToken(result.challengeToken);
        } else {
          router.push(redirectTo);
        }
      },
    });
  });

  const handleMfaSubmit = () => {
    if (!mfaChallengeToken || mfaCode.length < 6) return;
    setMfaError(null);
    mfaMutation.mutate(
      { challengeToken: mfaChallengeToken, code: mfaCode },
      {
        onSuccess: () => router.push(redirectTo),
        onError: () => setMfaError("Invalid or expired code. Please try again"),
      },
    );
  };

  return (
    <AuthShell>
      {mfaChallengeToken ? (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-text-primary">Two-factor verification</h1>
            <p className="mt-1.5 text-sm text-text-secondary">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
          </div>

          <OtpInput
            length={6}
            value={mfaCode}
            onChange={setMfaCode}
            onComplete={(code) => {
              setMfaCode(code);
            }}
            error={mfaError ?? undefined}
            label="Verification code"
          />

          <Button type="button" onClick={handleMfaSubmit} isLoading={mfaMutation.isPending} disabled={mfaCode.length < 6} className="w-full">
            Verify
          </Button>
          <button type="button" onClick={() => setMfaChallengeToken(null)} className="text-sm text-text-secondary hover:text-text-primary">
            Back to login
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-text-primary">Welcome back</h1>
            <p className="mt-1.5 text-sm text-text-secondary">Log in to your VittamHub account</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <PasswordInput label="Password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />

            <div className="flex items-center justify-between">
              <Controller
                control={control}
                name="rememberMe"
                render={({ field }) => <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} label="Remember me" />}
              />
              <Link href="/forgot-password" className="text-sm font-medium text-brand-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {captcha?.siteKey && <Turnstile siteKey={captcha.siteKey} onVerify={(token) => setValue("captchaToken", token)} />}

            {oauthError && !loginMutation.isError && (
              <p role="alert" className="text-sm text-danger-600">
                {oauthError}
              </p>
            )}

            {loginMutation.isError && (
              <p role="alert" className="text-sm text-danger-600">
                {loginMutation.error instanceof Error ? loginMutation.error.message : "Invalid email or password"}
              </p>
            )}

            <Button type="submit" isLoading={loginMutation.isPending} className="w-full">
              Log in
            </Button>
          </form>

          <OAuthButtons />

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-brand-primary hover:underline">
              Create account
            </Link>
          </p>

          <SecurityBadges />
        </div>
      )}
    </AuthShell>
  );
}
