"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@vittamhub/api-client";
import { requestPasswordResetInputSchema, type RequestPasswordResetInput } from "@vittamhub/types";
import { Button, Input } from "@vittamhub/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(requestPasswordResetInputSchema) });

  if (mutation.isSuccess) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="h-6 w-6 text-success-600" />
          </span>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Check your email</h1>
          <p className="text-sm text-text-secondary">
            If an account exists for that address, we&apos;ve sent a link to reset your password.
          </p>
          <Link href="/login" className="mt-2 text-sm font-medium text-brand-primary hover:underline">
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Reset your password</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Button type="submit" isLoading={mutation.isPending} className="w-full">
            Send reset link
          </Button>
        </form>
        <Link href="/login" className="text-center text-sm text-text-secondary hover:text-text-primary">
          Back to login
        </Link>
      </div>
    </AuthCard>
  );
}
