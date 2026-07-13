"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPassword } from "@vittamhub/api-client";
import { confirmPasswordResetInputSchema, type ConfirmPasswordResetInput } from "@vittamhub/types";
import { Button, PasswordInput } from "@vittamhub/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthCard } from "@/components/auth/AuthCard";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmPasswordResetInput>({
    resolver: zodResolver(confirmPasswordResetInputSchema),
    defaultValues: { token, password: "" },
  });

  if (mutation.isSuccess) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="h-6 w-6 text-success-600" />
          </span>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Password updated</h1>
          <p className="text-sm text-text-secondary">You can now log in with your new password.</p>
          <Link
            href="/login"
            className="mt-2 rounded-button bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-heading text-xl font-semibold text-text-primary">Invalid reset link</h1>
          <p className="text-sm text-text-secondary">This password reset link is missing or malformed.</p>
          <Link href="/forgot-password" className="mt-2 text-sm font-medium text-brand-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Choose a new password</h1>
        </div>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate({ ...data, token }))}
          className="flex flex-col gap-4"
        >
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            showStrength
            error={errors.password?.message}
            {...register("password")}
          />
          {mutation.isError && (
            <p className="text-sm text-danger-600">
              {mutation.error instanceof Error ? mutation.error.message : "This link is invalid or has expired"}
            </p>
          )}
          <Button type="submit" isLoading={mutation.isPending} className="w-full">
            Reset password
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
