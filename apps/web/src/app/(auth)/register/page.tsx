"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCaptchaSiteKey, useRegister } from "@vittamhub/api-client";
import { registerInputSchema, type RegisterableRole, type RegisterInput } from "@vittamhub/types";
import { Button, Checkbox, Input, PasswordInput, RadioCardGroup } from "@vittamhub/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Logo } from "@/components/Logo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Turnstile } from "@/components/auth/Turnstile";
import { ACCOUNT_TYPES } from "@/data/account-types";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Marketing CTAs link with lowercase roles (?role=investor) while the role
  // enum values are uppercase (INVESTOR) — match case-insensitively and fall
  // back to the account-type picker for anything unrecognized, so a bad or
  // lowercase param can never crash the page on `selectedType.icon`.
  const rawRoleParam = searchParams.get("role");
  const roleFromQuery =
    ACCOUNT_TYPES.find((type) => type.role.toLowerCase() === rawRoleParam?.toLowerCase())?.role ?? null;

  const [selectedRole, setSelectedRole] = useState<RegisterableRole | null>(roleFromQuery);
  const { data: captcha } = useCaptchaSiteKey();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    // `role` is chosen via the account-type UI (query param or picker), not a
    // form field — but the schema requires it, so it must live in form state
    // or validation silently fails and the submit handler never runs.
    defaultValues: { email: "", password: "", fullName: "", role: roleFromQuery ?? undefined, acceptedTerms: undefined },
  });

  const onSubmit = handleSubmit((data) => {
    if (!selectedRole) return;
    registerMutation.mutate(
      { ...data, role: selectedRole },
      { onSuccess: () => router.push("/verify-email") },
    );
  });

  if (!selectedRole) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold text-text-primary sm:text-3xl">
            How will you use VittamHub?
          </h1>
          <p className="mt-2 text-text-secondary">Choose the account type that fits you — you can&apos;t change this later.</p>
        </div>

        <RadioCardGroup
          columns={3}
          value={selectedRole ?? ""}
          onChange={(value) => {
            setSelectedRole(value as RegisterableRole);
            setValue("role", value as RegisterableRole);
          }}
          options={ACCOUNT_TYPES.map((type) => ({
            value: type.role,
            icon: type.icon,
            title: type.title,
            description: type.description,
            benefits: type.benefits,
          }))}
        />

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  const selectedType = ACCOUNT_TYPES.find((type) => type.role === selectedRole)!;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <div className="rounded-card border border-border bg-surface p-8 shadow-lg">
          <button
            type="button"
            onClick={() => setSelectedRole(null)}
            className="mb-4 text-sm text-text-secondary hover:text-text-primary"
          >
            ← Change account type
          </button>

          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <selectedType.icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-heading text-lg font-semibold text-text-primary">Create your account</h1>
              <p className="text-xs text-text-secondary">Registering as {selectedType.title}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              showStrength
              hint="At least 10 characters, with uppercase, lowercase, and a number"
              error={errors.password?.message}
              {...register("password")}
            />

            <Controller
              control={control}
              name="acceptedTerms"
              render={({ field }) => (
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={field.onChange}
                  error={errors.acceptedTerms?.message}
                  label={
                    <>
                      I agree to the{" "}
                      <a href="#" className="text-brand-primary underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-brand-primary underline">
                        Privacy Policy
                      </a>
                    </>
                  }
                />
              )}
            />

            {captcha?.siteKey && (
              <Turnstile siteKey={captcha.siteKey} onVerify={(token) => setValue("captchaToken", token)} />
            )}

            {registerMutation.isError && (
              <p className="text-sm text-danger-600">
                {registerMutation.error instanceof Error ? registerMutation.error.message : "Registration failed"}
              </p>
            )}

            <Button type="submit" isLoading={registerMutation.isPending} className="w-full">
              Create account
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-secondary">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <OAuthButtons />

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
