"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCaptchaSiteKey, useRegister } from "@vittamhub/api-client";
import { accountEmailSchema, MOBILE_COUNTRY_CODES, passwordSchema } from "@vittamhub/types";
import { Button, Checkbox, Input, PasswordInput, RadioCardGroup } from "@vittamhub/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Turnstile } from "@/components/auth/Turnstile";
import { ChoiceChips } from "@/components/onboarding/fields";
import { PERSONA_GROUPS, PERSONA_OPTIONS, personaFromQuery, type PersonaOption } from "@/data/account-types";

/**
 * The sign-up form, asking what BHASKAR asks before registration: nationality,
 * first and last name, email, mobile and a password, and one checkbox for age
 * and the terms. Everything else waits for onboarding, where the profile
 * strength meter starts at 20% from these answers.
 */
const registerFormSchema = z
  .object({
    nationality: z.enum(["INDIAN", "OTHER"]),
    otherNationality: z.string().trim().max(80).optional(),
    firstName: z.string().trim().min(1, "Enter your first name").max(60),
    lastName: z.string().trim().max(60).optional(),
    email: accountEmailSchema,
    countryCode: z.enum(MOBILE_COUNTRY_CODES),
    // Typed the way people type it; spaces and dashes are fine.
    mobile: z.string().trim().min(1, "Enter your mobile number"),
    password: passwordSchema,
    captchaToken: z.string().max(4096).optional(),
    acceptedTerms: z.literal(true, { errorMap: () => ({ message: "Confirm you're 18 or older and accept the Terms" }) }),
  })
  .superRefine((input, ctx) => {
    if (input.nationality === "OTHER" && !input.otherNationality) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["otherNationality"], message: "Enter your nationality" });
    }
    const digits = input.mobile.replace(/[\s\-().]/g, "");
    const valid = input.countryCode === "+91" ? /^[6-9]\d{9}$/.test(digits.replace(/^0/, "")) : /^\d{6,14}$/.test(digits);
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobile"],
        message: input.countryCode === "+91" ? "Enter a 10-digit mobile number" : "Enter a valid mobile number",
      });
    }
  });
type RegisterForm = z.infer<typeof registerFormSchema>;

const NATIONALITY_OPTIONS = [
  { value: "INDIAN" as const, label: "Indian" },
  { value: "OTHER" as const, label: "Other" },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Marketing links say ?role=investor or ?persona=student; anything unknown opens the picker.
  const fromQuery = personaFromQuery({ role: searchParams.get("role"), persona: searchParams.get("persona") });
  const [selected, setSelected] = useState<PersonaOption | null>(fromQuery);
  // Someone new pressed Google (or GitHub, LinkedIn) on the login page: they need an account type first.
  const fromGoogleLogin = searchParams.get("error") === "oauth_no_account";

  if (!selected) {
    return (
      <AuthShell variant="wide">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold text-text-primary sm:text-3xl">Who are you joining as?</h1>
          <p className="mt-2 text-text-secondary">Pick the one that fits best. It decides which questions we ask next.</p>
        </div>

        {fromGoogleLogin && (
          <p className="mb-6 rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm text-text-primary" role="status">
            There&apos;s no VittamHub account with that address yet. Pick who you&apos;re joining as, then continue with it again to
            create your account.
          </p>
        )}

        <div className="flex flex-col gap-8">
          {PERSONA_GROUPS.map((group) => (
            <section key={group.group} aria-labelledby={`group-${group.group}`} className="flex flex-col gap-3">
              <div>
                <h2 id={`group-${group.group}`} className="title-3 text-text-primary">
                  {group.title}
                </h2>
                <p className="caption-5">{group.description}</p>
              </div>
              <RadioCardGroup
                columns={3}
                value=""
                onChange={(value) => setSelected(PERSONA_OPTIONS.find((option) => option.persona === value) ?? null)}
                options={PERSONA_OPTIONS.filter((option) => option.group === group.group).map((option) => ({
                  value: option.persona,
                  icon: option.icon,
                  title: option.title,
                  description: option.description,
                }))}
              />
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return <AccountForm persona={selected} onChangePersona={() => setSelected(null)} onDone={() => router.push("/verify-email")} />;
}

function AccountForm({ persona, onChangePersona, onDone }: { persona: PersonaOption; onChangePersona: () => void; onDone: () => void }) {
  const { data: captcha } = useCaptchaSiteKey();
  const registerMutation = useRegister();
  const mobileId = useId();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { nationality: "INDIAN", countryCode: "+91", firstName: "", lastName: "", email: "", mobile: "", password: "" },
  });
  const nationality = watch("nationality");

  const onSubmit = handleSubmit((data) => {
    const typed = data.mobile.replace(/[\s\-().]/g, "");
    // An Indian number typed with its trunk 0 ("098765 43210") is stored without it.
    const digits = data.countryCode === "+91" ? typed.replace(/^0(?=\d{10}$)/, "") : typed;
    registerMutation.mutate(
      {
        role: persona.role,
        persona: persona.persona,
        fullName: [data.firstName, data.lastName].filter(Boolean).join(" "),
        email: data.email,
        mobileNumber: `${data.countryCode}${digits}`,
        nationality: data.nationality === "INDIAN" ? "Indian" : data.otherNationality,
        password: data.password,
        captchaToken: data.captchaToken,
        acceptedTerms: data.acceptedTerms,
      },
      { onSuccess: onDone },
    );
  });

  return (
    <AuthShell>
      <button type="button" onClick={onChangePersona} className="mb-4 text-sm text-text-secondary hover:text-text-primary">
        ← Change who you are
      </button>

      <div className="mb-6 flex items-center gap-3">
        <persona.icon className="h-8 w-8 shrink-0 text-brand-primary" aria-hidden="true" />
        <div>
          <h1 className="font-heading text-lg font-semibold text-text-primary">Create your account</h1>
          <p className="text-xs text-text-secondary">Joining as {persona.title.toLowerCase()}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="nationality"
          render={({ field }) => (
            <ChoiceChips label="Nationality" required options={NATIONALITY_OPTIONS} value={field.value} onChange={field.onChange} />
          )}
        />
        {nationality === "OTHER" && (
          <Input label="Your nationality" required autoComplete="country-name" error={errors.otherNationality?.message} {...register("otherNationality")} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" required autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>

        <Input label="Email" required type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={mobileId} className="text-sm font-medium text-text-primary">
            Mobile number
            <span aria-hidden="true" className="ml-0.5 text-danger-600">
              *
            </span>
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              className="h-11 rounded-input border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              {...register("countryCode")}
            >
              {MOBILE_COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              id={mobileId}
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="98765 43210"
              aria-required="true"
              aria-invalid={!!errors.mobile}
              aria-describedby={`${mobileId}-help`}
              className={`h-11 w-full rounded-input border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                errors.mobile ? "border-danger-600" : "border-border"
              }`}
              {...register("mobile")}
            />
          </div>
          <p id={`${mobileId}-help`} className={`text-xs ${errors.mobile ? "text-danger-600" : "text-text-secondary"}`} role={errors.mobile ? "alert" : undefined}>
            {errors.mobile?.message ?? "Private. Only used to reach you about your account."}
          </p>
        </div>

        <PasswordInput
          label="Password"
          required
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
                  I&apos;m 18 or older, and I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener" className="text-brand-primary underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener" className="text-brand-primary underline">
                    Privacy Policy
                  </a>
                </>
              }
            />
          )}
        />

        {captcha?.siteKey && <Turnstile siteKey={captcha.siteKey} onVerify={(token) => setValue("captchaToken", token)} />}

        {registerMutation.isError && (
          <p className="text-sm text-danger-600" role="alert">
            {registerMutation.error instanceof Error ? registerMutation.error.message : "Registration failed"}
          </p>
        )}

        <Button type="submit" isLoading={registerMutation.isPending} className="w-full">
          Create account
        </Button>
        <p className="text-center text-xs text-text-secondary">Takes a minute. You&apos;ll add the rest of your profile after this.</p>
      </form>

      <OAuthButtons className="mt-6" persona={persona.persona} />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
