"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClientError, useChangePassword } from "@vittamhub/api-client";
import { changePasswordInputSchema } from "@vittamhub/types";
import { Button, Card, PasswordInput, useToast } from "@vittamhub/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = changePasswordInputSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two new passwords don't match",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one",
  });
type FormValues = z.infer<typeof formSchema>;

const EMPTY: FormValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const changePassword = useChangePassword();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: EMPTY });

  if (!hasPassword) {
    return (
      <Card className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold text-text-primary">Password</h2>
        <p className="text-sm text-text-secondary">
          You sign in with Google, GitHub or LinkedIn, so this account has no password. To add one, sign out and choose
          &ldquo;Forgot password&rdquo; on the login page. We&apos;ll email you a link to set it.
        </p>
      </Card>
    );
  }

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setServerError(null);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      setServerError(
        error instanceof ApiClientError && error.status === 429
          ? "Too many attempts. Give it a minute and try again."
          : error instanceof ApiClientError && error.status >= 400 && error.status < 500 && error.apiError.message
            ? error.apiError.message
            : "We couldn't change your password just now. Please try again in a moment.",
      );
      return;
    }
    reset(EMPTY);
    toast({
      variant: "success",
      title: "Password changed",
      description: "Every other device has been signed out. This one stays signed in.",
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">Password</h2>
          <p className="mt-1 text-sm text-text-secondary">Changing it signs you out on every other device.</p>
        </div>

        <Controller
          control={control}
          name="currentPassword"
          render={({ field }) => (
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              error={errors.currentPassword ? "Enter your current password" : undefined}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field }) => (
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              showStrength
              hint="At least 10 characters, with a capital letter, a lowercase letter and a number."
              error={errors.newPassword?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordInput
              label="New password again"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...field}
            />
          )}
        />

        {serverError && (
          <p role="alert" className="text-sm text-danger-600">
            {serverError}
          </p>
        )}

        <div>
          <Button type="submit" isLoading={changePassword.isPending}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
