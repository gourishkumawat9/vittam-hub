"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCaptchaSiteKey, useCompleteMfaChallenge, useLogin } from "@vittamhub/api-client";
import { loginInputSchema, type LoginInput } from "@vittamhub/types";
import { Button, Checkbox, Input, OtpInput, PasswordInput } from "@vittamhub/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Logo } from "@/components/Logo";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { SecurityBadges } from "@/components/auth/SecurityBadges";
import { Turnstile } from "@/components/auth/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/onboarding";

  const { data: captcha } = useCaptchaSiteKey();
  const loginMutation = useLogin();
  const mfaMutation = useCompleteMfaChallenge();

  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);

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
        onError: () => setMfaError("Invalid or expired code — please try again"),
      },
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block">
        <AuthIllustration />
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </Link>

          {mfaChallengeToken ? (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-heading text-2xl font-semibold text-text-primary">Two-factor verification</h1>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Enter the 6-digit code from your authenticator app, or a recovery code.
                </p>
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

              <Button
                type="button"
                onClick={handleMfaSubmit}
                isLoading={mfaMutation.isPending}
                disabled={mfaCode.length < 6}
                className="w-full"
              >
                Verify
              </Button>
              <button
                type="button"
                onClick={() => setMfaChallengeToken(null)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
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
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register("password")}
                />

                <div className="flex items-center justify-between">
                  <Controller
                    control={control}
                    name="rememberMe"
                    render={({ field }) => (
                      <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} label="Remember me" />
                    )}
                  />
                  <Link href="/forgot-password" className="text-sm font-medium text-brand-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {captcha?.siteKey && (
                  <Turnstile siteKey={captcha.siteKey} onVerify={(token) => setValue("captchaToken", token)} />
                )}

                {loginMutation.isError && (
                  <p className="text-sm text-danger-600">
                    {loginMutation.error instanceof Error ? loginMutation.error.message : "Invalid email or password"}
                  </p>
                )}

                <Button type="submit" isLoading={loginMutation.isPending} className="w-full">
                  Log in
                </Button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-secondary">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

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
        </div>
      </div>
    </div>
  );
}
